/**
 * What a form action sends back to the screen: it worked, or it did not and here is why.
 * Every form action in the app returns this same shape.
 */
export type ActionResult = { ok: true } | { ok: false; message: string };
