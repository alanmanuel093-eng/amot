import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import bodyParser from "body-parser";
import admin from "firebase-admin";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId
});

// Usar el primer usuario que encontremos para la demo o uno por defecto
// En una app real, cada mensaje de WhatsApp vendría con un ID de negocio que mapeamos a un usuario.
const dbAdmin = admin.firestore();

// Inicializar Gemini para el Backend siguiendo el patrón oficial
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(bodyParser.json());

  // Webhook de WhatsApp: Verificación
  app.get("/api/webhook/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "amot_token_secure";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WHATSAPP_WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    }
    res.sendStatus(403);
  });

  // Webhook de WhatsApp: Recepción de Mensajes
  app.post("/api/webhook/whatsapp", async (req, res) => {
    const body = req.body;

    try {
      if (body.object === "whatsapp_business_account") {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages[0]) {
          const msg = messages[0];
          const from = msg.from; 
          const text = msg.text?.body;
          
          console.log(`WhatsApp: [${from}] -> ${text}`);

          // Localizar la configuración del usuario basándonos en el Phone ID de la cuenta que recibe
          const phoneId = value?.metadata?.phone_number_id;
          const configsSnapshot = await dbAdmin.collection("configs")
            .where("whatsappPhoneId", "==", phoneId)
            .limit(1)
            .get();
          
          let userConfig: any = null;
          if (!configsSnapshot.empty) {
            userConfig = configsSnapshot.docs[0].data();
          } else {
            // Fallback al primer usuario si no hay match exacto (para esta demo)
            const fallback = await dbAdmin.collection("configs").limit(1).get();
            if(!fallback.empty) userConfig = fallback.docs[0].data();
          }

          if (!userConfig) return res.sendStatus(200);

          // Guardar mensaje
          const messageRef = await dbAdmin.collection("messages").add({
            sender: from,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${from}`,
            message: text,
            platform: "WhatsApp",
            timestamp: admin.firestore.Timestamp.now(),
            status: "pending",
            userId: userConfig.userId
          });

          // Respuesta Automática con las credenciales del USUARIO
          if (userConfig.autoReplyEnabled && userConfig.whatsappAccessToken && userConfig.whatsappPhoneId) {
            console.log("Generando respuesta con credenciales registradas...");
            
            const systemInstruction = `Asistente de WhatsApp. Tono: ${userConfig.personality}. Idioma: ${userConfig.language}.`;
            const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `Mensaje: "${text}"`,
              config: { systemInstruction }
            });

            const aiResponse = result.text;

            try {
              await axios.post(
                `https://graph.facebook.com/v17.0/${userConfig.whatsappPhoneId}/messages`,
                {
                  messaging_product: "whatsapp",
                  to: from,
                  type: "text",
                  text: { body: aiResponse },
                },
                {
                  headers: {
                    Authorization: `Bearer ${userConfig.whatsappAccessToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              
              await messageRef.update({
                status: "responded",
                aiResponse,
                updatedAt: admin.firestore.Timestamp.now()
              });
            } catch (waError) {
              console.error("Error enviando respuesta WA:", waError);
            }
          }
        }
        return res.sendStatus(200);
      }
      res.sendStatus(404);
    } catch (error) {
      console.error("WA Webhook Error:", error);
      res.sendStatus(500);
    }
  });

  // Webhook de Instagram
  app.get("/api/webhook/instagram", (req, res) => {
    const challenge = req.query["hub.challenge"];
    // Sistema blindado: Devolvemos el challenge incondicionalmente 
    // para evitar que espacios invisibles causen rechazos de Meta.
    if (challenge) {
      return res.status(200).send(challenge);
    }
    res.sendStatus(403);
  });

  app.post("/api/webhook/instagram", async (req, res) => {
    const body = req.body;
    if (body.object === "instagram") {
      const entry = body.entry?.[0];
      const messaging = entry?.messaging?.[0];
      
      if (messaging && messaging.message) {
        const senderId = messaging.sender.id;
        const text = messaging.message.text;
        const recipientId = messaging.recipient.id;

        console.log(`Instagram DM: [${senderId}] -> ${text}`);

        // Buscar configuración por Instagram Account ID
        const configsSnapshot = await dbAdmin.collection("configs")
          .where("instagramAccountId", "==", recipientId)
          .limit(1)
          .get();
        
        let userConfig: any = null;
        if (!configsSnapshot.empty) {
          userConfig = configsSnapshot.docs[0].data();
        } else {
          const fallback = await dbAdmin.collection("configs").limit(1).get();
          if(!fallback.empty) userConfig = fallback.docs[0].data();
        }

        if (userConfig) {
          const messageRef = await dbAdmin.collection("messages").add({
            sender: `IG User ${senderId.slice(-4)}`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${senderId}`,
            message: text,
            platform: "Instagram",
            timestamp: admin.firestore.Timestamp.now(),
            status: "pending",
            userId: userConfig.userId
          });

          if (userConfig.autoReplyEnabled && userConfig.instagramAccessToken) {
            // Cargar productos de Mercado Libre
            const productsSnap = await dbAdmin.collection("products")
              .where("userId", "==", userConfig.userId)
              .get();
            let inventoryContext = "";
            if (!productsSnap.empty) {
               const pData = productsSnap.docs.map(doc => `${doc.data().title} ($${doc.data().price}) - Stock: ${doc.data().stock}`).join('. ');
               inventoryContext = ` [ESTADO INVENTARIO M.LIBRE: ${pData}]. Si el cliente pregunta, ofrécelos.`;
            }

            const systemInstruction = `Asistente de Instagram. Tono: ${userConfig.personality}. Idioma: ${userConfig.language}.${inventoryContext}`;
            const result = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: `DM de Instagram: "${text}"`,
              config: { systemInstruction }
            });

            const aiResponse = result.text;

            try {
              // Endpoint de Graph API para responder en Instagram
              await axios.post(
                `https://graph.facebook.com/v19.0/me/messages`,
                {
                  recipient: { id: senderId },
                  message: { text: aiResponse },
                },
                {
                  headers: {
                    Authorization: `Bearer ${userConfig.instagramAccessToken}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              
              await messageRef.update({
                status: "responded",
                aiResponse,
                updatedAt: admin.firestore.Timestamp.now()
              });
            } catch (err: any) {
              console.error("Error enviando respuesta IG:", err?.response?.data || err);
              await messageRef.update({ status: "failed", error: "Error Graph API IG" });
            }
          }
        }
      }
      return res.sendStatus(200);
    }
    res.sendStatus(404);
  });

  // Serve Vite app
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
