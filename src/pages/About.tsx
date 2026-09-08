const About = () => (
  <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
    <h1 className="section-header text-center mb-6">About</h1>
    <p className="text-slate-800 dark:text-slate-200">
      <b>Feathers of Roorkee</b> is a community-driven platform dedicated to celebrating the rich avian diversity of Roorkee. Our mission is to foster appreciation for birds through photography, citizen science, and responsible bird-watching.
    </p>
    <p className="text-slate-800 dark:text-slate-200">
      This project is lead by  <b>Mohak Ketan Patil</b>, along with friends and family who are passionate about birds, nature, and conservation. We believe in ethical birding, sharing knowledge, and protecting our feathered friends for generations to come.
    </p>
    <p className="text-slate-800 dark:text-slate-200">
      Whether you are a seasoned birder or just starting out, we invite you to explore, contribute, and join our vibrant community!
    </p>
    <p className="text-slate-800 dark:text-slate-200">
      I made this website for showcasing bird photographs submitted by the citizens of Roorkee. Feathers of Roorkee is an engaging webapp that will help maintain a record of the avian biodiversity of Roorkee, while capturing it through the lenses of this town's own photographers!
    </p>

    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Features & Functionalities</h2>
      <ul className="list-disc pl-5 space-y-2 text-slate-800 dark:text-slate-200">
        <li><b>Bird Directory:</b> A comprehensive database of bird species found in Roorkee, complete with detailed descriptions, IUCN conservation status, and migratory tracking.</li>
        <li><b>Bird Checklists & Leaderboards:</b> Explore hierarchical checklists of bird families and species, and compete on the community Leaderboard.</li>
        <li><b>Photo Submissions:</b> Signed-up users can contribute their own bird photographs to the community database.</li>
        <li><b>Workshops & Galleries:</b> Discover and register for local birdwatching workshops. Share your experiences and workshop photos in the interactive Workshop Gallery.</li>
        <li><b>User Profiles:</b> Manage your account, track your submissions, and view your impact.</li>
        <li><b>Admin Moderation:</b> Dedicated admin tools for reviewing submissions, managing species data, workshops, and maintaining the platform's quality.</li>
      </ul>
    </div>

    <div className="mt-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Tech Stack</h2>
      <p className="text-slate-800 dark:text-slate-200 mb-4">
        Built with modern web technologies to ensure a fast, responsive, and secure experience:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-slate-800 dark:text-slate-200">
        <li><b>Frontend:</b> React.js with Vite for fast builds and optimized performance.</li>
        <li><b>Styling:</b> Tailwind CSS for a beautiful, responsive UI design, including full dark mode support.</li>
        <li><b>Backend & APIs:</b> Netlify Serverless Functions for secure, scalable API endpoints.</li>
        <li><b>Database:</b> MongoDB for robust, scalable data storage of users, birds, and photos.</li>
        <li><b>Authentication:</b> Firebase Auth for secure user sign-up and login workflows.</li>
      </ul>
    </div>
  </div>
)

export default About