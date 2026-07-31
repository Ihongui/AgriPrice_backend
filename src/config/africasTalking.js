import AfricasTalking from "africastalking";

const username = process.env.AFRICASTALKING_USERNAME;
const apiKey = process.env.AFRICASTALKING_API_KEY;

const africasTalking =
  username && apiKey
    ? AfricasTalking({
        username,
        apiKey
      })
    : null;

export default africasTalking;
