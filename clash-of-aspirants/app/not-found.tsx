"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const NotFoundAnimation = () => {
  return (
    <div className="flex justify-center items-center h-screen w-2xl ml-[500px]">
      <DotLottieReact
        src="https://lottie.host/7d236359-47a5-4eb5-9700-0d4f7ec1fea3/16b19FgAFC.lottie"
        loop
        autoplay
        style={{ width: 400, height: 400 }} // Adjust size here
      />
    </div>
  );
};

export default NotFoundAnimation;
