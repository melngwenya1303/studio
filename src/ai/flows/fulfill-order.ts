
'use server';

/**
 * @fileOverview A flow for handling Print-on-Demand (POD) order fulfillment.
 *
 * This file defines a Genkit flow that takes order details and uses a tool
 * to send them to a POD service for fulfillment. This flow is designed to be
 * triggered by a server-side process, such as a Cloud Function responding to
 * a Shopify webhook.
 *
 * - fulfillOrder - The main function to trigger order fulfillment.
 * - FulfillOrderInput - The input schema for the fulfillment flow.
 * - FulfillOrderOutput - The output schema for the fulfillment flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input and Output Schemas
const FulfillOrderInputSchema = z.object({
  orderId: z.string().describe('The unique identifier for the order from the e-commerce platform (e.g., Shopify).'),
  customerName: z.string().describe("The customer's full name."),
  shippingAddress: z.string().describe("The customer's full shipping address."),
  imageUrl: z
    .string()
    .describe('The public URL of the design image to be printed.'),
  productType: z.string().describe('The type of product being ordered (e.g., "iPhone 15 Pro Decal").'),
  podPartner: z.string().describe('The name of the POD partner to fulfill the order (e.g., "Printify").'),
});
export type FulfillOrderInput = z.infer<typeof FulfillOrderInputSchema>;

const FulfillOrderOutputSchema = z.object({
  success: z.boolean().describe('Whether the order was successfully sent to the fulfillment partner.'),
  confirmationNumber: z.string().optional().describe('The confirmation number from the POD partner.'),
  message: z.string().describe('A message detailing the result of the fulfillment attempt.'),
});
export type FulfillOrderOutput = z.infer<typeof FulfillOrderOutputSchema>;


// Tool: Send order to POD service
const sendOrderToPodService = ai.defineTool(
    {
        name: 'sendOrderToPodService',
        description: 'Sends the order details to the specified Print-on-Demand (POD) fulfillment partner.',
        inputSchema: FulfillOrderInputSchema,
        outputSchema: FulfillOrderOutputSchema,
    },
    async (input) => {
        console.log(`Simulating sending order ${input.orderId} to ${input.podPartner} for fulfillment.`);
        // In a real implementation, this function would contain the logic to make an API call
        // to the actual POD service (e.g., Printify, Printful) using the creator's saved API key.
        const isSuccess = Math.random() > 0.1; // 90% success rate for simulation
        
        if (isSuccess) {
            const confirmation = `POD_CONF_${crypto.randomUUID().substring(0, 12).toUpperCase()}`;
            console.log(`Order ${input.orderId} successfully sent. POD Confirmation: ${confirmation}`);
            return {
                success: true,
                confirmationNumber: confirmation,
                message: `Order successfully submitted to ${input.podPartner}. Confirmation: ${confirmation}.`,
            };
        } else {
            console.error(`Failed to send order ${input.orderId} to ${input.podPartner}.`);
            return {
                success: false,
                message: `Failed to submit order to ${input.podPartner}. Please check system logs for details.`,
            };
        }
    }
);


// Genkit Prompt
const fulfillmentPrompt = ai.definePrompt({
    name: 'fulfillmentPrompt',
    input: {schema: FulfillOrderInputSchema},
    output: {schema: FulfillOrderOutputSchema},
    tools: [sendOrderToPodService],
    prompt: `You are an automated fulfillment coordinator for the SurfaceStory platform.
A new order fulfillment request has been received. Your task is to process this request by sending the order details to the correct Print-on-Demand (POD) partner using the available tools.

Order Details:
- Order ID: {{{orderId}}}
- Customer: {{{customerName}}}
- Address: {{{shippingAddress}}}
- Product: {{{productType}}}
- POD Partner: {{{podPartner}}}
- Image URL: {{{imageUrl}}}

Use the 'sendOrderToPodService' tool to process this fulfillment request. Do not add any commentary; just execute the tool with the provided details.
`,
});

// Main exported function
export async function fulfillOrder(input: FulfillOrderInput): Promise<FulfillOrderOutput> {
  return fulfillOrderFlow(input);
}


// Genkit Flow
const fulfillOrderFlow = ai.defineFlow(
  {
    name: 'fulfillOrderFlow',
    inputSchema: FulfillOrderInputSchema,
    outputSchema: FulfillOrderOutputSchema,
  },
  async (input) => {
    // This flow is designed to be called by a server-side process, like a Cloud Function.
    // The function would receive a webhook from Shopify, extract the necessary data,
    // and then invoke this flow with the correct input.
    
    const {output} = await fulfillmentPrompt(input);
    
    if (!output) {
        throw new Error('The fulfillment flow failed to produce a valid output. The tool call may have failed.');
    }

    return output;
  }
);
