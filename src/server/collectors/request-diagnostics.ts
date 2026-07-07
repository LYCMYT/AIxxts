export type RequestErrorDiagnostics = {
  category: string;
  message: string;
  retryable: boolean;
};

export function requestErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function classifyRequestError(error: unknown) {
  const normalized = requestErrorMessage(error).toLowerCase();

  if (!normalized) {
    return "暂无错误";
  }

  if (/(timed out|timeout|etimedout|aborterror|aborted)/.test(normalized)) {
    return "网络超时";
  }

  if (/(429|too many requests|rate limit)/.test(normalized)) {
    return "上游限流";
  }

  if (/(tls|ssl|certificate|cert|unable to verify)/.test(normalized)) {
    return "TLS/证书错误";
  }

  if (/(http\s*5\d\d|\b5\d\d\b|bad gateway|service unavailable)/.test(normalized)) {
    return "上游服务错误";
  }

  if (/(http\s*4\d\d|\b4\d\d\b|forbidden|unauthorized)/.test(normalized)) {
    return "上游拒绝访问";
  }

  if (/(fetch failed|network|econnreset|econnrefused|enotfound|socket)/.test(normalized)) {
    return "网络连接失败";
  }

  return "其他错误";
}

export function requestErrorDiagnostics(error: unknown): RequestErrorDiagnostics {
  const message = requestErrorMessage(error);
  const category = classifyRequestError(error);

  return {
    category,
    message,
    retryable: ["网络超时", "网络连接失败", "上游限流", "上游服务错误"].includes(category),
  };
}
