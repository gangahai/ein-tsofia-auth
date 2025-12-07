// Prompts Index - Centralized Export
// Imports all prompt configurations from separate files

import { familyPrompt } from './family.prompt';
import kindergartenPrompt from './kindergarten.prompt';
import caregiverPrompt from './caregiver.prompt';

export { familyPrompt, kindergartenPrompt, caregiverPrompt };

// Re-export for backward compatibility
export const prompts = {
    family: familyPrompt,
    kindergarten: kindergartenPrompt,
    caregiver: caregiverPrompt
};

export default prompts;
