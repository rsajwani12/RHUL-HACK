RelayAI

RelayAI is an AI-powered assistant that integrates Google Gemini API for task execution and uses Solana blockchain to store immutable proofs of AI actions. The system provides verifiable and tamper-proof records of tasks performed by the AI, ensuring trust and transparency.

Features

AI Task Execution: Uses Google Gemini API to process natural language queries, generate responses, and break down tasks.

Blockchain Proofs: Stores task proofs on Solana blockchain, providing immutable verification of AI actions.

Voice Output: Integrates ElevenLabs Text-to-Speech for spoken responses to make the AI more interactive.

Server Hosting: Deployed on DigitalOcean for scalability and reliable hosting.

Technologies Used

Languages: JavaScript (Node.js)

Frameworks: Express (Backend API)

APIs:

Google Gemini API (Generative AI model for task execution)

ElevenLabs Text-to-Speech (TTS) (For voice output)

Solana Blockchain (For storing immutable task proofs)

Cloud Services: DigitalOcean (For hosting the backend API)

Deployment: PM2 for process management and ensuring the app runs continuously

How to Run the Project
1. Clone the Repository

First, clone the project to your local machine or server.

git clone https://github.com/yourusername/relayai.git
cd relayai

2. Install Dependencies

Ensure you have Node.js and npm installed. Then install the project dependencies.

npm install

3. Set Up Environment Variables

Create a .env file in the root directory with the following environment variables:

GEMINI_API_KEY=your_google_gemini_api_key
SOLANA_SECRET_KEY_JSON=your_solana_secret_key_json
SOLANA_RPC=https://api.devnet.solana.com
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id


Replace the placeholders with your actual API keys and Solana secret key.

4. Start the Server

Run the server with:

node index.js


The app will be running at http://localhost:3000/.

5. (Optional) Deploy to DigitalOcean

If you're deploying to DigitalOcean:

Create a Droplet and SSH into the instance.

Upload your project files to the droplet.

Follow the same setup steps as above to install dependencies and start the server.

Use PM2 to keep the app running in the background:

pm2 start index.js
pm2 save

How It Works

User Input: A user provides a request (e.g., "Find the cheapest flight to Dubai next month").

AI Task Breakdown: The Google Gemini API processes the request and generates actionable steps.

Execution & Proof Generation: The AI executes the task and generates a proof hash.

Solana Proof Storage: The proof is submitted to Solana blockchain as a transaction, providing immutable verification.

Output: The results are returned to the user, along with the Solana transaction signature for proof verification.

Contributing

If you'd like to contribute to this project, feel free to fork the repository and submit a pull request. Ensure that you follow these guidelines:

Add clear documentation for any new functionality.

Ensure that the code is thoroughly tested.

Follow standard JavaScript conventions and best practices.

Future Improvements

Integration with more third-party APIs for flight booking, weather data, etc.

Smart contract integration on Solana for automatic task execution.

Mobile app version using React Native.

Multi-language support for a global user base.

License

This project is licensed under the MIT License – see the LICENSE
 file for details.

Acknowledgements

Google Gemini API for task processing.

Solana Blockchain for immutable proof storage.

ElevenLabs for Text-to-Speech integration.

DigitalOcean for cloud hosting.
