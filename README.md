# Flow Connect

**Flow Connect** (formerly known as AREA) is a powerful automation tool that allows you to create workflows to connect your favorite apps and services.

---

## 🚀 What is Flow Connect?

Flow Connect is a web and mobile application that enables you to automate tasks by creating workflows. A workflow is a sequence of actions and reactions that are triggered by specific events. For example, you can create a workflow that automatically sends a Discord message when you receive a new email in Gmail.

---

## ✨ Features

*   **Workflow Automation:** Create custom workflows to automate your daily tasks.
*   **Microservice Architecture:** A robust and scalable architecture with a main API and several microservices.
*   **Web and Mobile Apps:** Manage your workflows from anywhere with our web and mobile applications.
*   **Extensible:** Easily add new services and integrations.

---

## 🛠️ Services

Flow Connect currently supports the following services:

| ID | Name          | Actions | Reactions |
|:--:|:--------------|:-------:|:---------:|
| 1  | Spotify       |    2    |     6     |
| 2  | Google Sheets |    3    |     9     |
| 3  | YouTube       |    0    |    14     |
| 4  | Twitch        |    4    |     6     |
| 5  | Discord       |    5    |     5     |
| 6  | Gmail         |    1    |     5     |

---

## ⚙️ Getting Started

### Prerequisites

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/AREA.git
    cd AREA
    ```
2.  Create a `.env` file from the `.env.example` and fill in the required values.

### Launching the Project

*   **For Development:**
    ```bash
    docker-compose -f docker-compose-dev.yaml up --build
    ```
*   **For Local Production:**
    ```bash
    docker-compose up --build
    ```
*   **For Production (on a VPS):**
    ```bash
    docker-compose -f docker-compose-prod.yaml up --build
    ```

---

## 📚 Documentation

*   **API Documentation:** [api/README.md](./api/README.md)
*   **Web App Documentation:** [webapp/README.md](./webapp/README.md)
*   **Mobile App Documentation:** [mobileapp/README.md](./mobileapp/README.md)
*   **User Stories:** [USERSTORIES.md](./userStories.md)
*   **User Journeys:** [USERJOURNEYS.md](./userJourneys.md)


---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](./Contribute.md) to get started.

---

## ✅ Testing

This project uses unit tests to ensure the quality of the code. You can find more information about the tests in the [tests documentation](./tests/readme.md).

---

## 🌐 Production

Our production instance is available at [https://flowconnect.dev](https://flowconnect.dev).

---

## 👥 Credits

This project was made possible by the following contributors:

| Name                | Picture                                                                                                                                                           |
|:--------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Ulysse Mercadal](https://github.com/ulysse-mercadal) | ![Profile Picture](https://avatars.githubusercontent.com/u/146720787?v=4&size=200)                                                                                    |
| [Nathan Deleger](https://github.com/nathandeleger)    | ![Profile Picture](https://avatars.githubusercontent.com/u/146707451?v=4&size=200)                                                                                    |
| [Nicolas Nunney](https://github.com/nicolasnny)    | ![Profile Picture](https://avatars.githubusercontent.com/u/106173230?v=4&size=200)                                                                                    |
| [Lorenzo La Rocca](https://github.com/lorenzolarc)  | ![Profile Picture](https://avatars.githubusercontent.com/u/86523064?v=44&size=200)                                                                                     |
| [Max Robert](https://github.com/MaxxRobert)        | ![Profile Picture](https://media.licdn.com/dms/image/v2/D5603AQE5AUbloOxgDg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1712666502135?e=2147483647&v=beta&t=0UtEAxsssekP8Vhc-6hVvtgU_y_ZSMfVor99_VSSPqI) |
