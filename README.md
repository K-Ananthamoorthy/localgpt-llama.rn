# 🧠 localgpt-llama.rn

A privacy-focused React Native application that runs **LLaMA-based language models locally on-device** using [`llama.rn`](https://github.com/pocketpal-ai/llama.rn). No internet required. 100% offline. Ideal for secure and private AI experiences on mobile.

---

## 📲 Key Features

- 🔒 **Local LLM inference** powered by [`llama.rn`](https://github.com/pocketpal-ai/llama.rn)
- 💬 Full **LocalGPT chat** experience
- 📦 **Model selection UI** to switch between downloaded models
- 🔗 **Hugging Face integration** for downloading and managing models
- 📱 **Device hardware checks** (RAM, CPU, storage) to ensure compatibility
- 🌙 Clean, minimal UI with React Native — runs on **Android** and **iOS**

---

## 🚀 Getting Started

> ✅ Make sure your environment is set up:  
> [React Native Environment Setup Guide](https://reactnative.dev/docs/environment-setup)

### 1. Clone the Repository

```bash
git clone https://github.com/K-Ananthamoorthy/localgpt-llama.rn.git
cd localgpt-llama.rn

```
2. Install Dependencies
```bash
# Using npm

npm install

# OR using Yarn
yarn install
```
3. Start Metro Bundler
```bash
# Using npm
npm start

# OR using Yarn
yarn start
```
4. Run the App
📱 Android

```bash
# Using npm
npm run android

# OR using Yarn
yarn android
```
🍏 iOS
If you're running the app for the first time on iOS or changed native dependencies:
```bash
bundle install
bundle exec pod install
```
Then run:
```bash
# Using npm
npm run ios

# OR using Yarn
yarn ios
```
💡 You can also open the project in Android Studio or Xcode for manual builds and debugging.

🧪 Development Notes
Entry point: App.tsx
Source code lives inside src/
UI components: src/components/
Screens: src/screens/
LLM utilities: src/utils/
Config and constants: src/config/
Supports live reloading via Fast Refresh
To force reload:

Android : Press R twice or open dev menu (Cmd/Ctrl + M)
iOS : Press R in the simulator

```bash
localgpt-llama.rn/
│
├── android/               # Native Android code
├── ios/                   # Native iOS code
├── src/                   # Source code
│   ├── components/        # Reusable UI elements
│   ├── screens/           # App screens (Chat, Settings, etc.)
│   ├── utils/             # Model loading, hardware check, etc.
│   └── config/            # Model config, constants
├── App.tsx                # App entry point
├── package.json           # Project metadata
├── README.md              # This file
└── ...
```
✅ Requirements
Physical Android/iOS device with ≥ 4GB RAM recommended
Node.js, React Native CLI, and native dev tools installed
Simulators may not handle model inference well — use a real device for best results
📚 Useful Links
React Native Docs
llama.rn GitHub
Hugging Face Models
CocoaPods Setup
🤝 Contributing
Contributions, bug reports, and feature suggestions are welcome! Feel free to fork the repo and submit a pull request.

🛡️ License
This project is licensed under the MIT License.
