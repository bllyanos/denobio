const shouldCache = (Deno.env.get("ENABLE_CACHE") ?? "false") === "true";

const textEncoder = new TextEncoder();

const command = new Deno.Command("deno", { args: ["task", "tailwind"] });
await command.output();

if (shouldCache) {
  const fileContent = await Deno.readFile("public/style.css");
  const hash = await getFileHash(fileContent);
  await Deno.writeFile("meta/hashkey", textEncoder.encode(hash));

  await Deno.copyFile("public/style.css", `public/style.${hash}.css`);
  await Deno.copyFile("public/favicon.svg", `public/favicon.${hash}.svg`);
}

async function getFileHash(file: Uint8Array<ArrayBuffer>, length = 6) {
  const arrayBuffer = file;
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, length);
}
