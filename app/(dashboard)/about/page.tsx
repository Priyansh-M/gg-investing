import type { JSX } from 'react'
import { 
  Mail, 
  ExternalLink, 
  Layers,
  FolderGit2
} from 'lucide-react'

// Custom SVGs for GitHub and Discord (to prevent lucide-react brand icon missing errors)
const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.098.246.195.373.288a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.89.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
)

export default function AboutPage(): JSX.Element {

  // =========================================================================
  // 🛠️ EDIT YOUR OTHER PROJECTS HERE
  // =========================================================================
  const otherProjects: Array<{
    title: string
    description: string
    tags: string[]
    url: string
  }> = []

  // =========================================================================
  // 🛠️ EDIT YOUR CONTACT LINKS HERE
  // =========================================================================
  const contactLinks = [
    {
      name: 'GitHub',
      url: 'https://github.com/your-username',
      icon: GithubIcon,
      description: 'Check out my repositories & projects',
    },
    {
      name: 'Discord',
      url: 'https://discord.com/users/your-discord-id',
      icon: DiscordIcon,
      description: 'Connect with me on Discord',
    },
    {
      name: 'Email',
      url: 'mailto:your.email@example.com',
      icon: Mail,
      description: 'Get in touch directly',
    },
  ]

  const techStack = [
    'Next.js',
    'TypeScript',
    'Supabase',
    'Tailwind CSS',
    'Recharts',
    'Finnhub API',
  ]

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-6 text-slate-100">
      
      {/* Header Profile */}
      <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-bold text-2xl shadow-lg shrink-0">
          PM
        </div>

        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PM
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Building applications, interactive tools, and web experiments.
          </p>
        </div>
      </div>

      {/* About Me & Tech Stack */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Original Description */}
        <div className="md:col-span-2 border border-slate-800 rounded-2xl bg-[#121724] p-6 shadow-xl space-y-3">
          <h2 className="text-xl font-bold text-amber-400">About Me</h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Hello, I'm PM and im a CS student with a keen interest in building random stuff. This project is the culmination of my skills as of now, and I hope it is useful and enjoyable to use. PS Ill update my information at some point
          </p>
        </div>

        {/* Tech Stack */}
        <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
            <Layers className="w-4 h-4" />
            <h2>Built With</h2>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {techStack.map((tech) => (
              <span 
                key={tech} 
                className="bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs px-2.5 py-1 rounded-lg"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Other Projects Section */}
      <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
          <FolderGit2 className="w-4 h-4" />
          <h2>Other Projects I've Built</h2>
        </div>

        {otherProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherProjects.map((project) => (
              <a
                key={project.title}
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-amber-500/30 p-4 rounded-xl transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-medium text-sm group-hover:text-amber-400 transition-colors">
                      {project.title}
                    </h3>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <span key={tag} className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-xs italic">
            No additional projects listed yet. Edit <code className="text-amber-400/80 bg-slate-800 px-1 py-0.5 rounded">otherProjects</code> in code to display them here.
          </p>
        )}
      </div>

      {/* Contact Section */}
      <div className="border border-slate-800 rounded-2xl bg-[#121724] p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-amber-400">Contact</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {contactLinks.map((link) => {
            const Icon = link.icon
            return (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group border border-slate-800 bg-slate-900/50 hover:bg-slate-800/60 hover:border-amber-500/30 p-3.5 rounded-xl transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-amber-500/10 text-slate-300 group-hover:text-amber-400 flex items-center justify-center transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-white font-medium text-xs sm:text-sm group-hover:text-amber-400 transition-colors truncate">
                      {link.name}
                    </h3>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0" />
              </a>
            )
          })}
        </div>
      </div>

    </div>
  )
}