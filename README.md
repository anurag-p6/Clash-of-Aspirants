# Clash of Aspirants

Clash of Aspirants is a real-time, AI-powered quiz application designed to provide users with an engaging and interactive learning experience.

## Features

- **Real-Time Quizzes**: Compete in quizzes that update in real-time, ensuring a dynamic and competitive environment.
- **AI-Powered Questions**: Leverage artificial intelligence to generate diverse and challenging questions tailored to the user's proficiency level.
- **User Authentication**: Secure user registration and login system to personalize the quiz experience.
- **Leaderboard**: Track and display top performers to foster a competitive spirit among users.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (managed with Prisma & NeonDB)
- **Authentication**: NextAuth.js
- **AI Integration**: Langchain.js, GeminiAI
- **Cloud Services**: AWS S3 for storage, AWS Textract for text extraction
- **Deployment**: Vercel

![image](https://github.com/user-attachments/assets/c6c949a7-376d-4a22-bc3a-8f6115aaddc5)


## Getting Started

To set up and run the project locally, follow these steps:

### Prerequisites

- **Node.js**: Ensure you have Node.js installed on your machine.
- **Docker**: Required to run the PostgreSQL database in a container.
- **NeonDB Account**: Create an account at [NeonDB](https://neon.tech/) and set up a PostgreSQL instance.

### Installation

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/anurag-p6/Clash-of-Aspirants.git
   ```

2. **Navigate to the Project Directory**:

   ```bash
   cd Clash-of-Aspirants
   ```

3. **Create Environment Variables File**:

   ```bash
   cp .env.example .env
   ```

   Fill in the necessary environment variables in the `.env` file, including your NeonDB connection URL.

4. **Install Dependencies**:

   ```bash
   npm install
   ```

5. **Set Up Prisma with NeonDB**:

   ```bash
   npx prisma migrate deploy
   ```

   This will apply all migrations to your NeonDB instance.

6. **Generate Prisma Client**:

   ```bash
   npx prisma generate
   ```

7. **Start the Application**:
    ```
    npm run dev 
    ```
    

   The application will be running at [http://localhost:3000](http://localhost:3000).

## Contributing

We welcome contributions from the community to enhance the features and functionality of Clash of Aspirants. To contribute:

1. **Fork the Repository**.
2. **Create a New Branch**:

   ```bash
   git checkout -b feature/YourFeatureName
   ```

3. **Commit Your Changes**:

   ```bash
   git commit -m 'Add some feature'
   ```

4. **Push to the Branch**:

   ```bash
   git push origin feature/YourFeatureName
   ```

5. **Open a Pull Request**.

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---