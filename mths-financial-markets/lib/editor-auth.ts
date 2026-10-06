import {getChatGPTUser} from '@/app/chatgpt-auth';
// Owner identity verified from the Site's access policy. Enforced on every write.
export async function isEditor(){const user=await getChatGPTUser();return !!user&&user.email.toLowerCase()==='snottyfive@gmail.com';}
