import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { CandidateTopicEditor } from "./candidate-topic-editor";

test("CandidateTopicEditor renders current labels and available topic hints", () => {
  const html = renderToStaticMarkup(
    <CandidateTopicEditor
      candidateId="candidate-1"
      currentTopicTags={["AI Agent", "模型发布"]}
      topicOptions={[
        { id: "topic-1", label: "AI Agent" },
        { id: "topic-2", label: "AI 编程" },
      ]}
    />,
  );

  assert.match(html, /管理员主题修正/);
  assert.match(html, /AI Agent/);
  assert.match(html, /模型发布/);
  assert.match(html, /AI 编程/);
  assert.match(html, /保存主题/);
  assert.match(html, /data-testid="candidate-topic-editor"/);
});
