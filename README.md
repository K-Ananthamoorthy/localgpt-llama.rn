🧠 localgpt-llama.rn
A privacy-focused React Native application that runs LLaMA-based language models locally on-device using llama.rn. No internet required. 100% offline. Ideal for private, secure, mobile AI experiences.

📲 Key Features
🔒 Fully local LLM inference — powered by llama.rn

🧠 LocalGPT experience — lightweight, fast, and private

📦 Model selection UI — choose from multiple models

🔗 Direct Hugging Face integration — fetch and load models easily

📱 Device hardware check — automatically checks for minimum requirements (RAM, CPU, etc.)

🎨 Beautiful React Native UI — built for both Android & iOS

🚀 Getting Started
✅ Make sure you've completed the React Native Environment Setup before proceeding.

1. Clone the Repository
bash
Copy
Edit
git clone https://github.com/K-Ananthamoorthy/localgpt-llama.rn.git
cd localgpt-llama.rn
2. Install Dependencies
bash
Copy
Edit
# With npm
npm install

# OR with yarn
yarn install
3. Start the Metro Bundler
bash
Copy
Edit
npm start
# OR
yarn start
4. Run the App
Android
bash
Copy
Edit
npm run android
# OR
yarn android
iOS
Make sure CocoaPods are installed and synced:

bash
Copy
Edit
bundle install
bundle exec pod install
Then:

bash
Copy
Edit
npm run ios
# OR
yarn ios
🧪 Development Notes
Entry point: App.tsx

Main source code: src/ folder

Model management and hardware checks are handled via utilities in src/utils/

Model downloads use Hugging Face URLs; you can customize them in config

📁 Folder Structure
bash
Copy
Edit
localgpt-llama.rn/
│
├── android/              # Android native code
├── ios/                  # iOS native code
├── src/                  # Main app logic
│   ├── components/       # UI components
│   ├── screens/          # App screens
│   ├── utils/            # Model download, hardware checks, etc.
│   └── config/           # Constants and model settings
├── App.tsx               # App entry point
├── package.json
├── README.md             # This file
└── ...
✅ Requirements
Minimum 4GB RAM on device for most LLaMA models

Works on physical Android and iOS devices (simulators may not handle model inference)

llama.rn backend integrated directly (no llama.run)

📚 Resources
React Native Docs

llama.rn GitHub

Hugging Face Models

CocoaPods Docs

🤝 Contributing
Pull requests and issues are welcome! If you're using the app or improving it, feel free to fork and contribute.

🛡️ License
This project is licensed under the MIT License.
