export type OAuthProvider = "github" | "gitlab" | "bitbucket";

export type ProviderMeta = {
  id: OAuthProvider;
  label: string;
  description: string;
};

export const OAUTH_PROVIDERS: ProviderMeta[] = [
  {
    id: "github",
    label: "GitHub",
    description: "Connect GitHub to import repositories, commits, PRs, and merges.",
  },
  {
    id: "gitlab",
    label: "GitLab",
    description: "Connect GitLab to import repositories and activity metrics.",
  },
  {
    id: "bitbucket",
    label: "Bitbucket",
    description: "Connect Bitbucket Cloud to import repositories and activity metrics.",
  },
];
