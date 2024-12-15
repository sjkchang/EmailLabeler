export class CategorizeEmailDto {
  emailId: string;
  threadId: string;
  subject: string;
  content: string;
  associated_labels: string[];
}
