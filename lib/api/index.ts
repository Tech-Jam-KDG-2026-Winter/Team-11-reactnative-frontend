// API Client
export { apiRequest, ApiRequestError } from "./client";

// Questionnaire API
export {
  submitMorningQuestionnaire,
  submitNightQuestionnaire,
} from "./questionnaire";

// AI API
export { generateRecommendations, getMascotState, getHint, completeMascotOnboarding } from "./ai";

// Quests API
export { getTodayQuests, toggleQuestComplete, adoptEncounterQuest } from "./quests";

// Location API
export { recordLocation, getMyEncounters } from "./location";

// Stamps API（お疲れ様スタンプ）
export {
  sendThanksStamp,
  getThanksStampsReceivedCountToday,
  getThanksStampSentByEncounterIds,
} from "./stamps";

// User API
export { getMyProfile, updateMyAvatar, updateMyPersonality, getMyPersonality } from "./user";
export type { MyProfile, MascotPersonality } from "./user";

// Types
export type {
  Mood,
  Condition,
  MascotStatus,
  MascotImageUrls,
  QuestionnaireRequest,
  QuestionnaireResponse,
  Quest,
  RecommendedQuest,
  Mascot,
  RecommendationsResponse,
  MascotOnboardingRequest,
  MascotOnboardingResponse,
  HintRequest,
  HintResponse,
  ApiError,
  EncounterSession,
  EncounterWithQuests,
  CompletedQuest,
} from "./types";
