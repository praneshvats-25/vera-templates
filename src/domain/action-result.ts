/**
 * What a form action sends back to the screen: it worked, or it did not and here is why.
 */
export type ActionResult = { ok: true } | { ok: false; message: string };

/** The result of sending Vera a request. It also carries her reply. */
export type RequestActionResult =
  | {
      ok: true;
      reply: string;
      // The version this request saved, or null when nothing changed.
      savedVersion: number | null;
      // The version on screen right after the request.
      shownVersion: number;
    }
  | { ok: false; message: string };
