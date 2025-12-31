<!-- for setting up the frontend -->
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
edit tailwind.config.js to add content paths
<!-- add the following lines to tailwind.config.js -->
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
<!-- end edit -->

edit src/index.css to include Tailwind directives
<!-- add the following lines to src/index.css -->
@tailwind base;
@tailwind components;
@tailwind utilities;
<!-- end edit -->
install redux toolkit and react-redux
npm install @reduxjs/toolkit react-redux