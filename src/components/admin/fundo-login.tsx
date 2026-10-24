/**
 * Fundo da tela de login: o triângulo do logo — a empena do telhado — em
 * vários tamanhos, à deriva por trás do cartão de vidro.
 *
 * Cada peça tem duração própria e nenhuma repete o ciclo da vizinha, então
 * o conjunto nunca "fecha" um laço perceptível. Só transform é animado.
 */
const PECAS = [
  // largura, posição, opacidade, duração, deslocamento, giro inicial/final
  { w: "74vmax", left: "-20vmax", bottom: "-34vmax", a: 0.2, t: 22, x: "11vw", y: "-10vh", r0: "0deg", r1: "5deg" },
  { w: "46vmax", right: "-14vmax", top: "6%", a: 0.14, t: 18, x: "-9vw", y: "11vh", r0: "-5deg", r1: "3deg" },
  { w: "20vmax", left: "58%", top: "-6vmax", a: 0.26, t: 14, x: "7vw", y: "12vh", r0: "8deg", r1: "-4deg" },
  { w: "40vmax", right: "4%", bottom: "-24vmax", a: 0.18, t: 20, x: "-7vw", y: "-12vh", r0: "3deg", r1: "-5deg" },
  { w: "11vmax", left: "7%", top: "13%", a: 0.32, t: 12, x: "5vw", y: "-9vh", r0: "-10deg", r1: "8deg" },
] as const;

export function FundoLogin() {
  return (
    <div className="fundo-login" aria-hidden>
      {PECAS.map((p, i) => {
        const { w, a, t, x, y, r0, r1, ...posicao } = p;
        return (
          <i
            key={i}
            style={{
              width: w,
              ...posicao,
              ["--a" as string]: a,
              ["--t" as string]: `${t}s`,
              ["--d" as string]: `${-i * 5}s`,
              ["--x" as string]: x,
              ["--y" as string]: y,
              ["--r0" as string]: r0,
              ["--r1" as string]: r1,
            }}
          />
        );
      })}
    </div>
  );
}
