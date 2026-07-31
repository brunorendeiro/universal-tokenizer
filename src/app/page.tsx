import { Tokenizer } from "@/components/tokenizer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-10 sm:px-8 lg:px-12">
      <header className="mb-8 flex w-full max-w-[1600px] flex-col gap-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">
          Universal Tokenizer
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Conta tokens, mostra a separação exata e estima custos para GPT,
          Claude, Gemini, Llama, Mistral, Qwen e mais — tudo local no browser,
          sem chave de API.
        </p>
      </header>
      <Tokenizer />
      <footer className="text-muted-foreground mt-12 max-w-[1600px] text-center text-xs">
        GPT, Llama, Mistral, Qwen, Gemma, Phi-3, DeepSeek, OLMo e Falcon usam
        o tokenizer público oficial (contagem exata). A Anthropic, a Google
        (Gemini) e a xAI não publicam o tokenizer deles — esses valores são
        uma estimativa.
      </footer>
    </div>
  );
}
