import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {

  await prisma.reaction.upsert({
    where: { name: 'send_email' },
    update: {
        description: 'Send an email using Gmail',
        configSchema: {
            parameters: [
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
                { name: 'subject', type: 'string', required: true, description: 'Email subject' },
                { name: 'body', type: 'string', required: true, description: 'Email body (HTML allowed)' },
            ],
            output: [
                { name: 'id', type: 'string', required: true, description: 'ID of the sent Gmail message' },
                { name: 'threadId', type: 'string', required: true, description: 'Gmail thread ID of the sent message' },
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
            ]
        },
    },
    create: {
        name: 'send_email',
        description: 'Send an email using Gmail',
        configSchema: {
            parameters: [
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
                { name: 'subject', type: 'string', required: true, description: 'Email subject' },
                { name: 'body', type: 'string', required: true, description: 'Email body (HTML allowed)' },
            ],
            output: [
                { name: 'id', type: 'string', required: true, description: 'ID of the sent Gmail message' },
                { name: 'threadId', type: 'string', required: true, description: 'Gmail thread ID of the sent message' },
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
            ]
        },
    },
  });

  await prisma.reaction.upsert({
    where: { name: 'create_draft' },
    update: {
        description: 'Create a draft email in Gmail',
        configSchema: {
            parameters: [
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
                { name: 'subject', type: 'string', required: true, description: 'Email subject' },
                { name: 'body', type: 'string', required: true, description: 'Email body (HTML allowed)' },
            ],
            output: [
                { name: 'draftId', type: 'string', required: true, description: 'ID of the created draft' },
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
            ]
        },
    },
    create: {
        name: 'create_draft',
        description: 'Create a draft email in Gmail',
        configSchema: {
            parameters: [
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
                { name: 'subject', type: 'string', required: true, description: 'Email subject' },
                { name: 'body', type: 'string', required: true, description: 'Email body (HTML allowed)' },
            ],
            output: [
                { name: 'draftId', type: 'string', required: true, description: 'ID of the created draft' },
                { name: 'to', type: 'string', required: true, description: 'Recipient email address' },
            ]
        },
    },
  });

  await prisma.reaction.upsert({
    where: { name: 'add_label' },
    update: {
        description: 'Add a label to a Gmail message',
        configSchema: {
            parameters: [
                { name: 'id', type: 'string', required: true, description: 'The Gmail message ID to label' },
                { name: 'labelName', type: 'string', required: true, description: 'The name of the label to apply (will be created if it does not exist)' },
            ],
            output: [
                { name: 'id', type: 'string', required: true, description: 'ID of the labeled Gmail message' },
                { name: 'labelName', type: 'string', required: true, description: 'Applied label name' },
            ]
        },
    },
    create: {
        name: 'add_label',
        description: 'Add a label to a Gmail message',
        configSchema: {
            parameters: [
                { name: 'id', type: 'string', required: true, description: 'The Gmail message ID to label' },
                { name: 'labelName', type: 'string', required: true, description: 'The name of the label to apply (will be created if it does not exist)' },
            ],
            output: [
                { name: 'id', type: 'string', required: true, description: 'ID of the labeled Gmail message' },
                { name: 'labelName', type: 'string', required: true, description: 'Applied label name' },
            ]
        },
    },
  });

  await prisma.action.upsert({
    where: { name: 'email_received' },
    update: {
        description: 'Triggered when a new Gmail email is received',
        configSchema: {
            parameters: [],
            output: [
                { name: 'from', type: 'string', required: true, description: 'Email sender address' },
                { name: 'subject', type: 'string', required: true, description: 'Subject of the received email' },
                { name: 'body', type: 'string', required: true, description: 'Body of the received email' },
                { name: 'receivedAt', type: 'string', required: true, description: 'Timestamp when the email was received' },
                { name: 'id', type: 'string', required: true, description: 'Gmail message ID' },
            ]
        },
    },
    create: {
        name: 'email_received',
        description: 'Triggered when a new Gmail email is received',
        configSchema: {
            parameters: [],
            output: [
                { name: 'from', type: 'string', required: true, description: 'Email sender address' },
                { name: 'subject', type: 'string', required: true, description: 'Subject of the received email' },
                { name: 'body', type: 'string', required: true, description: 'Body of the received email' },
                { name: 'receivedAt', type: 'string', required: true, description: 'Timestamp when the email was received' },
                { name: 'id', type: 'string', required: true, description: 'Gmail message ID' },
            ]
        },
    },
  });

  await prisma.reaction.upsert({
    where: { name: 'flag_email' },
    update: {
      description: 'Mark a Gmail message as important',
      configSchema: {
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'The Gmail message ID to flag' },
        ],
        output: [
          { name: 'id', type: 'string', required: true, description: 'ID of the flagged Gmail message' },
          { name: 'flagged', type: 'boolean', required: true, description: 'Whether the message was successfully flagged' },
        ]
      }
    },
    create: {
      name: 'flag_email',
      description: 'Mark a Gmail message as important',
      configSchema: {
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'The Gmail message ID to flag' },
        ],
        output: [
          { name: 'id', type: 'string', required: true, description: 'ID of the flagged Gmail message' },
          { name: 'flagged', type: 'boolean', required: true, description: 'Whether the message was successfully flagged' },
        ]
      }
    }
  });

  await prisma.reaction.upsert({
    where: { name: 'reply_email' },
    update: {
      description: 'Reply to a Gmail message',
      configSchema: {
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'The Gmail message ID to reply to' },
          { name: 'body', type: 'string', required: true, description: 'Body of the reply email (HTML allowed)' },
        ],
        output: [
          { name: 'id', type: 'string', required: true, description: 'ID of the reply message' },
          { name: 'threadId', type: 'string', required: true, description: 'Gmail thread ID of the reply' },
        ]
      }
    },
    create: {
      name: 'reply_email',
      description: 'Reply to a Gmail message',
      configSchema: {
        parameters: [
          { name: 'id', type: 'string', required: true, description: 'The Gmail message ID to reply to' },
          { name: 'body', type: 'string', required: true, description: 'Body of the reply email (HTML allowed)' },
        ],
        output: [
          { name: 'id', type: 'string', required: true, description: 'ID of the reply message' },
          { name: 'threadId', type: 'string', required: true, description: 'Gmail thread ID of the reply' },
        ]
      }
    }
  });


  console.log('Gmail seed completed successfully!');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
