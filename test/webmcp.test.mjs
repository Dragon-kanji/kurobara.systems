import assert from "node:assert/strict";
import test from "node:test";
import { registerWebsiteWebMcp, WORKFLOW_STAGES } from "../src/webmcp.ts";

const REGISTRATION_BLOCKED_PATTERN = /registration blocked/u;
const UNKNOWN_STAGE_PATTERN = /Unknown Kurobara workflow stage/u;

const createHandlers = () => {
  const selectedStages = [];
  return {
    handlers: {
      getQuickstartCommands: () => "npm run self-host:smoke",
      selectWorkflowStage: (stage) => selectedStages.push(stage),
    },
    selectedStages,
  };
};

test("is a no-op when the browser does not expose WebMCP", async () => {
  const { handlers } = createHandlers();
  const controller = await registerWebsiteWebMcp({}, handlers);
  assert.equal(controller, undefined);
});

test("registers bounded landing-page tools and reuses existing handlers", async () => {
  const registrations = [];
  const document = {
    modelContext: {
      registerTool(tool, options) {
        registrations.push({ options, tool });
        return Promise.resolve();
      },
    },
  };
  const { handlers, selectedStages } = createHandlers();

  const controller = await registerWebsiteWebMcp(document, handlers);

  assert.ok(controller instanceof AbortController);
  assert.deepEqual(
    registrations.map(({ tool }) => tool.name),
    ["kurobara.select_workflow_stage", "kurobara.get_quickstart_commands"]
  );
  assert.deepEqual(
    registrations[0].tool.inputSchema.properties.stage.enum,
    WORKFLOW_STAGES
  );
  assert.equal(registrations[0].options.signal, controller.signal);
  assert.equal(registrations[1].options.signal, controller.signal);
  assert.equal(registrations[1].tool.annotations.readOnlyHint, true);

  const stageResult = await registrations[0].tool.execute({ stage: "verify" });
  assert.deepEqual(selectedStages, ["verify"]);
  assert.deepEqual(stageResult, {
    message: "verify is now visible in the Kurobara product view.",
    stage: "verify",
  });

  const quickstartResult = await registrations[1].tool.execute({});
  assert.equal(quickstartResult.commands, "npm run self-host:smoke");
  assert.equal(quickstartResult.copiesToClipboard, false);
  assert.equal(quickstartResult.executesCommands, false);
  assert.equal(quickstartResult.requiresProviderCredits, false);
});

test("rejects unknown workflow stages before changing the page", async () => {
  const registrations = [];
  const document = {
    modelContext: {
      registerTool(tool) {
        registrations.push(tool);
        return Promise.resolve();
      },
    },
  };
  const { handlers, selectedStages } = createHandlers();
  await registerWebsiteWebMcp(document, handlers);

  await assert.rejects(
    registrations[0].execute({ stage: "publish" }),
    UNKNOWN_STAGE_PATTERN
  );
  assert.deepEqual(selectedStages, []);
});

test("removes partial registrations when setup fails", async () => {
  const signals = [];
  const document = {
    modelContext: {
      registerTool(_tool, options) {
        signals.push(options.signal);
        if (signals.length === 2) {
          return Promise.reject(new Error("registration blocked"));
        }
        return Promise.resolve();
      },
    },
  };
  const { handlers } = createHandlers();

  await assert.rejects(
    registerWebsiteWebMcp(document, handlers),
    REGISTRATION_BLOCKED_PATTERN
  );
  assert.equal(signals.length, 2);
  assert.equal(signals[0], signals[1]);
  assert.equal(signals[0].aborted, true);
});
