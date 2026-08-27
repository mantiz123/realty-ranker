import { createServerFn } from "@tanstack/react-start";

export const crearVideoJob = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => {
    if (!(data instanceof FormData)) throw new Error("Invalid payload");
    return data;
  })
  .handler(async ({ data }) => {
    const { procesarCreacionVideo } = await import("./crear-video.server");
    return procesarCreacionVideo(data);
  });
