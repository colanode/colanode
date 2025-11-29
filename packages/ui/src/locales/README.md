# Internationalization (i18n) System

This directory contains all translation files for the Colanode UI.

## Supported Languages

- **English (en)** - Default language
- **French (fr)** - Français
- **German (de)** - Deutsch
- **Spanish (es)** - Español
- **Chinese (zh)** - 中文
- **Arabic (ar)** - العربية

## Features

- ✅ **Automatic language detection** from browser settings
- ✅ **Real-time language switching** without page reload
- ✅ **Persistent language preference** in app-metadata
- ✅ **RTL support** for Arabic
- ✅ **Parameter interpolation** for dynamic content
- ✅ **Type-safe** language codes with TypeScript

## Usage

### Basic Translation

```tsx
import { useI18n } from '@colanode/ui/contexts/i18n';

const MyComponent = () => {
  const { t } = useI18n();
  
  return <h1>{t('common.welcome')}</h1>;
};
```

### Translation with Parameters

```tsx
import { useI18n } from '@colanode/ui/contexts/i18n';

const MyComponent = () => {
  const { t } = useI18n();
  
  return (
    <p>{t('misc.recommendedSize', { width: '280', height: '280' })}</p>
  );
};
```

This will render: "Recommended size is 280px x 280px" (in the selected language).

### Changing Language

```tsx
import { useI18n, LanguageCode } from '@colanode/ui/contexts/i18n';

const LanguageSwitcher = () => {
  const { locale, setLocale } = useI18n();
  
  return (
    <button onClick={() => setLocale('fr')}>
      Switch to French
    </button>
  );
};
```

## Translation File Structure

All translation keys are organized by category:

- `common` - Common UI elements (buttons, labels, etc.)
- `auth` - Authentication and login
- `account` - Account management
- `workspace` - Workspace settings
- `channel` - Channel management
- `chat` - Chat and conversations
- `space` - Space management
- `collaborator` - Collaborator management
- `database` - Database features
- `file` - File management
- `server` - Server settings
- `app` - Application settings
- `errors` - Error messages
- `invite` - User invitations
- `appearance` - Theme and appearance
- `view` - View management
- `field` - Database fields
- `layout` - Layout options
- `page` - Page management
- `folder` - Folder management
- `storage` - Storage management
- `status` - Status information
- `plan` - Plan management
- `misc` - Miscellaneous
- `ui` - UI-specific messages

## Parameter Interpolation

Use curly braces `{paramName}` in translation values for dynamic content:

```json
{
  "misc": {
    "maxFileSize": "The maximum size per file is {size}MB."
  }
}
```

Then use it in your component:

```tsx
t('misc.maxFileSize', { size: '5' })
```

## Best Practices

### DO:
- Use parameters for dynamic values (numbers, sizes, names, etc.)
- Keep keys descriptive and organized by feature
- Use lowercase for parameter names
- Consider singular/plural forms when needed
- Test translations in all supported languages

### ❌ DON'T:
- Hardcode values in translation strings (use parameters instead)
- Create overly specific keys (e.g., `maxFileSize5MB` - use parameters!)
- Use very long translation keys
- Mix languages in the same file
- Forget to update all language files when adding new keys

## Adding a New Language

1. Create a new JSON file in this directory (e.g., `pt.json` for Portuguese)
2. Copy the structure from `en.json`
3. Translate all values to the new language
4. Update `packages/ui/src/contexts/i18n.tsx`:
   - Import the new translation file
   - Add the locale code to the `LanguageCode` type
   - Add the translation to the `translations` object
   - Update the `detectBrowserLocale` function
5. Update `packages/ui/src/components/app/app-appearance-settings.tsx`:
   - Add a new button for the language selector

## Type Safety

The `LanguageCode` type is exported from the i18n context:

```tsx
import { LanguageCode } from '@colanode/ui/contexts/i18n';

const languages: LanguageCode[] = ['en', 'fr', 'de', 'es', 'zh', 'ar'];
```

This ensures type safety when working with language codes throughout the application.

## RTL Support

Arabic language includes RTL (Right-to-Left) support. The direction is automatically set on the document element when Arabic is selected:

```tsx
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
```

## Responsive Design Considerations

When adding translations:
- Avoid fixed widths/heights on text containers
- Use `flex`, `truncate`, or `whitespace-normal` for text wrapping
- Test all languages to ensure UI doesn't break with longer translations
- Use padding/margin instead of fixed dimensions
- Consider that German and French translations are typically 20-30% longer than English
