export function DirectAnswer({ question, answer }: { question: string; answer: string }) {
  return (
    <section className="bg-blue-50 py-12 px-4 sm:px-6 lg:px-8 border-y border-blue-100" id="direct-answer" aria-label={`Answer to ${question}`}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{question}</h2>
        <div className="prose prose-blue prose-lg text-gray-700">
          <p className="font-medium">{answer}</p>
        </div>
      </div>
    </section>
  );
}
