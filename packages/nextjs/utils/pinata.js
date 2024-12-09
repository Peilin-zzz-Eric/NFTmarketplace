import axios from "axios";

export const uploadToPinata = async (file) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  const data = new FormData();
  data.append("file", file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  data.append("pinataMetadata", metadata);

  const JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNTQyZTUwOC00ZTc0LTQ3MDUtYWIwMS0zNjNkYjc2MjEzODMiLCJlbWFpbCI6ImVyaWNjYzA3MjFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjMwZWFlMTk3ZjY2NzIzNmEyNmNhIiwic2NvcGVkS2V5U2VjcmV0IjoiMDk1OGYxMmQ0NDRhOWNkZTc5YzExYzBiOTg2OGQ2MDZhNWY3MTFiNTg5NmI5NjFiYTQ2MmIzMTUxNmE4NTFiZSIsImV4cCI6MTc2NDg4MjM5Mn0.ys87gJkvv__z1PZPOrPxhDGyCbL6IjhVPuFb3LD04Ss";

  const config = {
    method: "post",
    url,
    headers: {
      Authorization: `Bearer ${JWT}`,
    },
    data,
  };

  try {
    const response = await axios(config);
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error("Error uploading to Pinata:", error.response?.data || error.message);
    throw new Error("Failed to upload to Pinata");
  }
};
