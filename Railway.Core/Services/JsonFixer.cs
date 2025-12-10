using System.Text.RegularExpressions;

public static class JsonFixer
{
    public static string ForceJson(string aiText)
    {
        if (string.IsNullOrWhiteSpace(aiText))
            return "{}";

        // Remove code block markers
        aiText = aiText
            .Replace("```json", "")
            .Replace("```", "")
            .Trim();

        // Fix trailing commas
        aiText = Regex.Replace(
            aiText,
            @"\,(\s*[\}\]])",
            "$1"
        );

        // Force JSON boundaries
        if (!aiText.StartsWith("{"))
            aiText = "{" + aiText;

        if (!aiText.EndsWith("}"))
            aiText = aiText + "}";

        return aiText;
    }
}
