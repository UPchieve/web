import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'

function getChatAvatar(userId, studentId, volunteerId){
  if(userId === studentId) return StudentIcon
  else if (userId === volunteerId) return VolunteerIcon
  else return ChatBotIcon
}

export default getChatAvatar