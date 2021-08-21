export const DEFAULT_LANGUAGE = "de";

interface ITranslations {
  [language: string]: string;
}

function t(translations: ITranslations) {
  return function (language = DEFAULT_LANGUAGE) {
    if (language in translations) {
      return translations[language];
    }
    const languages = Object.keys(translations);
    if (languages.length === 0) {
      return "<no translation defined>";
    }
    return translations[languages[0]];
  };
}
export const i18n = {
  HELP_TEXT: t({
    en: `Hello, this Telegram Bot will send notifications to different channels. You can subscribe the channels relevant for you by listing all channels with /channels and then select the ones you want. Click again to unsubscribe.
To view only a list of channels you subscribed to, use /mychannels.

You may want to subscribe the General channel. Use /channels to get started.

To change the language, use /language.`,
    de:
      `Hallo, dieser Telegram-Bot sendet Benachrichtigungen an verschiedene Kanäle (Channels). Du kannst die für dich relevanten Channels abonnieren (subscriben). ` +
      `Dafür kannst du mit dem Befehl /channels alle Channels auflisten und dann die für dich relevanten auswählen. ` +
      `Klicke einen Channel nochmal an zum Unsubscriben.
Um eine Liste nur mit Channels zu sehen, die du abonniert hast, nutze den Befehl /mychannels.

Vielleicht möchtest du ja den General-Channel (Allgemeines) abonnieren? Nutze /channels um loszulegen.

To change the language, use /language.`,
  }),
  you_dont_have_any_subscribed_channels_yet: t({
    en: `You don't have any subscribed channels yet. List all /channels and add one.`,
    de: `Du hast noch keine Channels abonniert. Liste mit /channels alle Channels auf und abonniere einen.`,
  }),
  your_channels: t({
    en: "Your Channels:",
    de: "Deine Channels:",
  }),
  languages: t({
    default: "Sprachen / Languages:",
  }),
  successfully_set_language: t({
    en: "Set language to English. Use /language to change it.",
    de: "Sprache auf Deutsch gesetzt. Nutze /language, um die Sprache zu ändern.",
  }),
  subscribed: t({
    default: "Subscribed",
  }),
  unsubscribed: t({
    default: "Unsubscribed",
  }),
};
