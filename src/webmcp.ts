export const WORKFLOW_STAGES = [
  "discover",
  "shortlist",
  "enrich",
  "verify",
  "export",
] as const;

export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

type ToolInput = Readonly<Record<string, unknown>>;

interface WebsiteTool {
  readonly annotations?: {
    readonly readOnlyHint?: boolean;
    readonly untrustedContentHint?: boolean;
  };
  readonly description: string;
  readonly execute: (input: ToolInput) => Promise<unknown>;
  readonly inputSchema?: Readonly<Record<string, unknown>>;
  readonly name: string;
  readonly title: string;
}

interface ModelContext {
  registerTool: (
    tool: WebsiteTool,
    options?: { readonly signal?: AbortSignal }
  ) => Promise<void>;
}

type WebMcpDocument = Document & {
  readonly modelContext?: ModelContext;
};

interface WebsiteWebMcpHandlers {
  readonly getQuickstartCommands: () => string;
  readonly selectWorkflowStage: (stage: WorkflowStage) => void;
}

export const isWorkflowStage = (value: unknown): value is WorkflowStage =>
  typeof value === "string" && WORKFLOW_STAGES.some((stage) => stage === value);

const getModelContext = (
  targetDocument: Document
): ModelContext | undefined => {
  const { modelContext } = targetDocument as WebMcpDocument;
  return typeof modelContext?.registerTool === "function"
    ? modelContext
    : undefined;
};

export const registerWebsiteWebMcp = async (
  targetDocument: Document,
  handlers: WebsiteWebMcpHandlers
): Promise<AbortController | undefined> => {
  const modelContext = getModelContext(targetDocument);
  if (!modelContext) {
    return;
  }

  const controller = new AbortController();
  const registrationOptions = { signal: controller.signal };

  try {
    await modelContext.registerTool(
      {
        annotations: {
          readOnlyHint: false,
          untrustedContentHint: false,
        },
        description:
          "Opens the Kurobara product view and displays one workflow stage. This only changes the current page view and does not run a Kurobara job.",
        execute(input) {
          const { stage } = input;
          if (!isWorkflowStage(stage)) {
            return Promise.reject(
              new TypeError("Unknown Kurobara workflow stage.")
            );
          }

          handlers.selectWorkflowStage(stage);
          return Promise.resolve({
            message: `${stage} is now visible in the Kurobara product view.`,
            stage,
          });
        },
        inputSchema: {
          additionalProperties: false,
          properties: {
            stage: {
              description: "The workflow stage to show on the page.",
              enum: WORKFLOW_STAGES,
              type: "string",
            },
          },
          required: ["stage"],
          type: "object",
        },
        name: "kurobara.select_workflow_stage",
        title: "Show Kurobara workflow stage",
      },
      registrationOptions
    );

    await modelContext.registerTool(
      {
        annotations: {
          readOnlyHint: true,
          untrustedContentHint: false,
        },
        description:
          "Returns the provider-free local evaluation commands without running or copying them.",
        execute() {
          return Promise.resolve({
            commands: handlers.getQuickstartCommands(),
            copiesToClipboard: false,
            documentationUrl:
              "https://github.com/Dragon-kanji/Kurobara/blob/main/docs/getting-started.md",
            executesCommands: false,
            requiresProviderCredits: false,
          });
        },
        inputSchema: {
          additionalProperties: false,
          properties: {},
          type: "object",
        },
        name: "kurobara.get_quickstart_commands",
        title: "Get Kurobara quickstart commands",
      },
      registrationOptions
    );
  } catch (error) {
    controller.abort();
    throw error;
  }

  return controller;
};
