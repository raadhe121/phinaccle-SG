// import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// import React from "npm:react@19.1.0";
// import { renderToStream } from "npm:@react-pdf/renderer@4.3.0";
// import { HealthReportPdf } from "./health_report.tsx";
// import { Buffer } from "node:buffer";

// Deno.serve(async (req) => {
//   if (req.method === "POST") {
//     try {
//       const data = await req.json();
//       const pdfStream = await renderToStream(React.createElement(HealthReportPdf, { data }));
      
//       // Convert stream to Uint8Array
//       const chunks: Uint8Array[] = [];
//       for await (const chunk of pdfStream) {
//         chunks.push(chunk);
//       }
//       const pdfBuffer = new Uint8Array(Buffer.concat(chunks));

//       return new Response(pdfBuffer, {
//         headers: {
//           "Content-Type": "application/pdf",
//           "Content-Disposition": 'attachment; filename="document.pdf"'
//         }
//       });
//     } catch (error) {
//       return new Response("PDF Generation Failed", { status: 500 });
//     }
//   }
//   return new Response("Method Not Allowed", { status: 405 });
// });

// /* To invoke locally:

//   1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
//   2. Make an HTTP request:

//   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/pdf-generate' \
//     --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//     --header 'Content-Type: application/json' \
//     --data '{"name":"Functions"}'

// */