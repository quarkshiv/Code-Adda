import axios from 'axios';

const JUDGE0_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const JUDGE0_HOST = 'judge0-ce.p.rapidapi.com';
const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY as string;

const headers = {
  'Content-Type': 'application/json',
  'X-RapidAPI-Host': JUDGE0_HOST,
  'X-RapidAPI-Key': API_KEY,
};

export async function createSubmission(
  source_code: string,
  language_id: number,
  stdin: string = ''
): Promise<string> {
  const { data } = await axios.post(
    `${JUDGE0_URL}?base64_encoded=false&wait=false`,
    { source_code, language_id, stdin },
    { headers }
  );
  return data.token;
}

export async function getSubmission(token: string) {
  const { data } = await axios.get(
    `${JUDGE0_URL}/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status`,
    { headers }
  );
  return data;
}

export async function runCode(
  source_code: string,
  language_id: number,
  stdin: string = ''
): Promise<{ stdout: string; stderr: string; compile_output: string; message: string; status: { id: number; description: string } }> {
  const token = await createSubmission(source_code, language_id, stdin);
  
  let result;
  let attempts = 0;
  
  while (attempts < 20) {
    result = await getSubmission(token);
    // status id 1 = In Queue, 2 = Processing
    if (result.status?.id <= 2) {
      await new Promise((res) => setTimeout(res, 1000));
      attempts++;
    } else {
      break;
    }
  }
  
  return result;
}
