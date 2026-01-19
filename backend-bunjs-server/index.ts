import { serve } from "bun";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { HealthReportPdf } from "./health_report.tsx";

const port = process.env.PORT || 4001;
const key = process.env.SUPABASE_WEBHOOK_API_KEY
console.log("HTTP Server on Port", port);
serve({
  port,
  routes: {
    // Static routes
    "/api/health": {
      GET: async (req) => {
        return new Response("OK", { status: 200 });
      }
    },
    "/api/health-report-pdf": {
      POST: async (req) => {
        const auth = req.headers.get("Authorization");
        if (auth !== `Bearer ${key}`) {
          console.log("Unauthorized");
          return new Response("Unauthorized", { status: 401 });
        }

        try {
          const data = await req.json();
          const startTime = Date.now();
          // @ts-ignore
          const pdfStream: ReadableStream<Uint8Array> = await renderToStream(React.createElement(HealthReportPdf, { data }));
          const timeTaken = Date.now() - startTime;
          console.log(`PDF Generation Time: ${timeTaken/1000}s`);
          return new Response(pdfStream, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": 'attachment; filename="document.pdf"'
            }
          });
        } catch (error) {
          return new Response("PDF Generation Failed", { status: 500 });
        }
      }
    }
  },
});
