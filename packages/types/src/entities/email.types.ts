// ─── EMAIL TEMPLATES ────────────────────────────────────────

// Declared variables for a template key; the renderer replaces `{{varName}}`.
interface EmailTemplateVariable {
  name: string;
  label: string;
  example?: string;
}

interface EmailTemplate {
  key: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromEmail?: string;
  active: boolean;
  description?: string;
  variables: EmailTemplateVariable[];
}