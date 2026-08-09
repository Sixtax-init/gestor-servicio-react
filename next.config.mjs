/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sin `typescript.ignoreBuildErrors`: silenciarlo fue lo que permitió que
  // llegara a producción un `as` falso en el parámetro `type` de /api/upload,
  // que abría un path traversal. Si el build falla por tipos, hay que
  // arreglar el tipo, no volver a apagar la comprobación.
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
}

export default nextConfig
