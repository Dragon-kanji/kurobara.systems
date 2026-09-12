import type { Language } from "./i18n.ts";

export interface ContactFields {
  readonly company: string;
  readonly email: string;
  readonly message: string;
  readonly name: string;
  readonly website: string;
}

export interface ContactPayload extends ContactFields {
  readonly locale: Language;
  readonly startedAt: number;
}

type ContactStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "success"; readonly reference: string }
  | { readonly kind: "rate-limit"; readonly retryAfter: string | null }
  | { readonly kind: "error" };

export interface ContactStatusCopy {
  readonly error: string;
  readonly loading: string;
  readonly rateLimit: string;
  readonly rateLimitWithDelay: string;
  readonly success: string;
}

interface ContactResponse {
  readonly ok: true;
  readonly reference: string;
}

const isContactResponse = (value: unknown): value is ContactResponse => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.ok === true &&
    typeof candidate.reference === "string" &&
    candidate.reference.trim().length > 0
  );
};

const payloadSignature = (payload: ContactPayload): string =>
  JSON.stringify({
    company: payload.company,
    email: payload.email,
    message: payload.message,
    name: payload.name,
    website: payload.website,
  });

export class ContactIdempotency {
  private readonly createUuid: () => string;
  private key: string | undefined;
  private signature: string | undefined;
  private payload: ContactPayload | undefined;

  constructor(createUuid: () => string) {
    this.createUuid = createUuid;
  }

  forPayload(payload: ContactPayload): string {
    return this.forAttempt(payload).key;
  }

  forAttempt(payload: ContactPayload): {
    readonly key: string;
    readonly payload: ContactPayload;
  } {
    const nextSignature = payloadSignature(payload);
    if (this.signature !== nextSignature || !this.key) {
      this.signature = nextSignature;
      this.key = this.createUuid();
      this.payload = { ...payload };
    }
    return { key: this.key, payload: this.payload ?? payload };
  }

  reset(): void {
    this.key = undefined;
    this.signature = undefined;
    this.payload = undefined;
  }
}

export interface SubmitContactResult {
  readonly reference?: string;
  readonly retryAfter?: string | null;
  readonly status: "success" | "rate-limit" | "error";
}

export const submitContact = async (
  payload: ContactPayload,
  idempotencyKey: string,
  request: typeof fetch = fetch
): Promise<SubmitContactResult> => {
  try {
    const response = await request("/api/contact", {
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      method: "POST",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 429) {
      return {
        retryAfter: response.headers.get("Retry-After"),
        status: "rate-limit",
      };
    }
    if (response.status !== 202) {
      return { status: "error" };
    }
    const result: unknown = await response.json();
    return isContactResponse(result)
      ? { reference: result.reference, status: "success" }
      : { status: "error" };
  } catch {
    return { status: "error" };
  }
};

const fieldsFromForm = (form: HTMLFormElement): ContactFields => {
  const data = new FormData(form);
  const text = (name: string): string => String(data.get(name) ?? "").trim();
  return {
    company: text("company"),
    email: text("email"),
    message: text("message"),
    name: text("name"),
    website: text("website"),
  };
};

const renderStatus = (
  element: HTMLElement,
  status: ContactStatus,
  copy: ContactStatusCopy
): void => {
  element.dataset.status = status.kind;
  if (status.kind === "idle") {
    element.textContent = "";
    return;
  }
  if (status.kind === "loading") {
    element.textContent = copy.loading;
    return;
  }
  if (status.kind === "success") {
    element.textContent = copy.success.replace("{reference}", status.reference);
    return;
  }
  if (status.kind === "rate-limit") {
    element.textContent = status.retryAfter
      ? copy.rateLimitWithDelay.replace("{delay}", status.retryAfter)
      : copy.rateLimit;
    return;
  }
  element.textContent = copy.error;
};

export interface ContactFormController {
  readonly applyLanguage: (language: Language, copy: ContactStatusCopy) => void;
}

export const setupContactForm = (
  form: HTMLFormElement,
  statusElement: HTMLElement,
  submitButton: HTMLButtonElement,
  initialLanguage: Language,
  initialCopy: ContactStatusCopy,
  request: typeof fetch = fetch,
  createUuid: () => string = () => crypto.randomUUID(),
  now: () => number = Date.now
): ContactFormController => {
  let language = initialLanguage;
  let copy = initialCopy;
  let startedAt = now();
  let status: ContactStatus = { kind: "idle" };
  let submitting = false;
  const idempotency = new ContactIdempotency(createUuid);

  const updateStatus = (next: ContactStatus): void => {
    status = next;
    renderStatus(statusElement, status, copy);
  };

  form.addEventListener("input", () => {
    if (status.kind !== "loading") {
      updateStatus({ kind: "idle" });
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting || !form.checkValidity()) {
      return;
    }
    const currentPayload: ContactPayload = {
      ...fieldsFromForm(form),
      locale: language,
      startedAt,
    };
    const { key, payload } = idempotency.forAttempt(currentPayload);
    submitting = true;
    submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    const inputs = form.querySelectorAll<
      HTMLInputElement | HTMLTextAreaElement
    >("input, textarea");
    for (const input of inputs) {
      input.readOnly = true;
    }
    updateStatus({ kind: "loading" });
    const result = await submitContact(payload, key, request);
    submitting = false;
    submitButton.disabled = false;
    form.setAttribute("aria-busy", "false");
    for (const input of inputs) {
      input.readOnly = false;
    }

    if (result.status === "success" && result.reference) {
      if (
        JSON.stringify(fieldsFromForm(form)) ===
        JSON.stringify({
          company: payload.company,
          email: payload.email,
          message: payload.message,
          name: payload.name,
          website: payload.website,
        })
      ) {
        form.reset();
      }
      idempotency.reset();
      startedAt = now();
      updateStatus({ kind: "success", reference: result.reference });
      return;
    }
    if (result.status === "rate-limit") {
      updateStatus({
        kind: "rate-limit",
        retryAfter: result.retryAfter ?? null,
      });
      return;
    }
    updateStatus({ kind: "error" });
  });

  return {
    applyLanguage: (nextLanguage, nextCopy) => {
      language = nextLanguage;
      copy = nextCopy;
      renderStatus(statusElement, status, copy);
    },
  };
};
