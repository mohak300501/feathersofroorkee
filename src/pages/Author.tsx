const Author = () => (
    <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <h1 className="section-header text-center mb-6">Author</h1>

        <center><img src="/assets/author.jpg" alt="Mohak Ketan Patil" className="rounded-2xl shadow-lg max-w-sm w-full" /></center>

        <p className="text-slate-800 dark:text-slate-200">
            I, <b>Mohak Ketan Patil</b>, am an individual passionate about birds, nature, and their conservation.
            You may read about my contribution at my alma mater IIT Roorkee.
        </p>
        <center><iframe src="/assets/contribution.pdf" width="100%" height="800" title="Contribution at IIT Roorkee" className="rounded-lg shadow-md border border-slate-200 dark:border-dark-border"></iframe></center><br/>
        <center><iframe src="/assets/ornithology.pdf" width="100%" height="500" title="Basic Course in Ornithology" className="rounded-lg shadow-md border border-slate-200 dark:border-dark-border"></iframe></center>
    </div>
)

export default Author