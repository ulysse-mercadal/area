# db schema

```mermaid
erDiagram
    User {
        int id PK
        string email
        string pwd_hash
        string name
        string surname
        enum role
        datetime createdAt
        datetime updatedAt
    }

    Credentials {
        int id PK
        string token
        datetime lastUsed
        int userId FK
        enum serviceType
    }

    Actions {
        int id PK
        string name
        enum serviceType
        string description
        json configSchema
    }

    Reactions {
        int id PK
        string name
        enum serviceType
        string description
        json configSchema
    }

    Workflow {
        int id PK
        string name
        string description
        boolean isActive
        int userId FK
        datetime lastTriggered
        datetime createdAt
        datetime updatedAt
    }

    Node {
        int id PK
        string name
        int workflowId FK
        int actionId FK
        int reactionId FK
        enum logicType
        json conf
        boolean isTriggered
        datetime lastExecuted
        int executionCount
        float positionX
        float positionY
    }

    NodeConnection {
        int id PK
        int sourceNodeId FK
        int targetNodeId FK
        int workflowId FK
        json condition
    }

    WorkflowExecution {
        int id PK
        int workflowId FK
        int triggeredBy FK
        enum status
        datetime startedAt
        datetime completedAt
        string errorMessage
    }

    NodeExecution {
        int id PK
        int nodeId FK
        int executionId FK
        enum status
        datetime startedAt
        datetime completedAt
        json output
        string logs
    }

    User ||--o{ Credentials : has
    User ||--o{ Workflow : creates

    Workflow ||--o{ Node : contains
    Workflow ||--o{ NodeConnection : contains
    Workflow ||--o{ WorkflowExecution : has

    Actions ||--o{ Node : defines_action
    Reactions ||--o{ Node : defines_reaction

    Node ||--o{ NodeConnection : source
    NodeConnection }o--|| Node : target

    WorkflowExecution ||--o{ NodeExecution : contains
    Node ||--o{ NodeExecution : executes
