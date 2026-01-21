export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ content: "Method not allowed" });
  }
  res.status(200).json({ status: "Server is running" });
}