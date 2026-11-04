"use client";

import { Callout, Classes, type Intent } from "@blueprintjs/core";
import { FormFeedback, FormHeader } from "./styles";

export function AuthFormHeader({ title, description }: { title: string; description?: string }) {
  return (
    <FormHeader>
      <h1 className={Classes.HEADING}>{title}</h1>
      {description ? <p className={Classes.TEXT_MUTED}>{description}</p> : null}
    </FormHeader>
  );
}

/** Mensagem de resultado anunciada por leitores de tela (`role="alert"` / `status`). */
export function AuthFormFeedback({ intent, message }: { intent: Intent; message: string }) {
  return (
    <FormFeedback role={intent === "danger" ? "alert" : "status"}>
      <Callout intent={intent} compact>
        {message}
      </Callout>
    </FormFeedback>
  );
}
