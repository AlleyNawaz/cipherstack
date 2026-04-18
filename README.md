# 🔐 CipherStack - Node-Based Cascade Encryption Builder

CipherStack is a mathematically robust, interactive visual tool for constructing cascade encryption pipelines. Chain multiple cipher algorithms together and literally *see* the transformation at every layer!

## 🔥 "Winner-Tier" Features

* **Visual Pipeline Architecture**: Stack nodes perfectly in sequence to observe data flow layer by layer.
* **Math-Secure `Text -> Hex -> Text` Safety**: Unlike normal XOR implementations that output non-printable bytes into textboxes, CipherStack intelligently transcodes XOR operations down to Hexadecimal logic. This guarantees perfect symmetry without fatal unicode bugs!
* **Zero-Configuration "Magic" Inversion**: The pipeline execution engine completely understands its graph. Toggle "Decrypt" mode, and the application instantly **visibly reverses** your entire cascade stack UI on-screen and mathematically unravels the stack from bottom-to-top!
* **The "Execution Moment"**: Feel the processing! CipherStack utilizes artificial execution boundaries, allowing you to configure endlessly without lag, and then fire a glowing `EXECUTE` pulse down the chain!
* **Portability Guarantee (Import / Export JSON)**: Export your entire intricately designed node architecture straight to your clipboard and share it immediately across environments.

## 🛠️ Built With
- **React (Vite)**: For blistering fast startup execution and state management. Functional components hooked up natively via memoization.
- **Vanilla CSS (No external UI frameworks!)**: 100% custom stylesheet featuring glassmorphic layers, pure CSS pulse animations, structural linear flexboxes, and dark-theme variables!
- Algorithms Implemented:
  - `Caesar Shift` (Integer Shift)
  - `XOR Cipher` (Symmetric String Key)
  - `Vigenère Cipher` (Polyalphabetic Keyword)
  - `Base64 Mapping` (Data Encoding bonus!)
  - `String Reverse` (Self-inverting transposition bonus!)

## 🚀 How to Run Locally

You only need Node.js installed to fire up CipherStack:

```bash
# 1. Clone the repository
git clone https://github.com/AlleyNawaz/cipherstack.git

# 2. Enter the directory
cd cipherstack

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## 🕹️ Quick Start Guide
1. Launch the app and stay in **Encrypt Mode**. Add a `Caesar Shift` node and an `XOR` node. Enter some fun text into the left Data Input box.
2. Click **EXECUTE PIPELINE** and observe the neon flow calculate the intermediate outputs.
3. Once completed, your Final Encrypted Output will flash. Click **Copy Output**.
4. Paste that exact output back into your original "Data Input" text box.
5. Click **Decrypt Mode** (Watch the UI reverse!). Click **EXECUTE PIPELINE**. Your exact starting string will pop back out!
