import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import wovenMark from "../docs/assets/brand/woven-mark.svg";
import hero from "../docs/assets/brand/woven-hero-flightpath.png";
import friction from "../docs/assets/slides/woven-friction.png";
import completeKit from "../docs/assets/slides/woven-complete-kit.png";
import humanConfirmation from "../docs/assets/slides/woven-human-confirmation.png";
import askOnce from "../docs/assets/demo/01-ask-once.png";
import reviewOnce from "../docs/assets/demo/02-review-once.png";
import confirmOnce from "../docs/assets/demo/03-confirm-once.png";
import merchantControl from "../docs/assets/demo/04-merchant-control.png";
import close from "../docs/assets/demo/05-close.png";
import buyerOverview from "../docs/assets/screenshots/buyer-overview.png";
import { voiceovers } from "./voiceover";

const FPS = 30;
const INK = "#0E4B3B";
const LIME = "#B7F522";
const PAPER = "#F4EEE4";
const WHITE = "#FCFAF5";
const BLUE = "#1545E8";
const CLAY = "#B64032";
const GREY = "#6D7974";

const s = (seconds: number) => Math.round(seconds * FPS);

const fade = (frame: number, duration: number) =>
  interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Brand = ({ dark = false }: { dark?: boolean }) => (
  <div
    style={{
      alignItems: "center",
      color: dark ? WHITE : INK,
      display: "flex",
      fontFamily: "Geist Variable",
      fontSize: 27,
      fontWeight: 760,
      gap: 14,
      letterSpacing: "0.14em",
      position: "absolute",
      textTransform: "uppercase",
      top: 42,
      left: 56,
      zIndex: 20,
    }}
  >
    <Img src={wovenMark} style={{ height: 48, width: 48 }} />
    Woven
  </div>
);

const Boundary = ({ dark = false }: { dark?: boolean }) => (
  <div
    style={{
      bottom: 28,
      color: dark ? "rgba(252,250,245,0.72)" : GREY,
      fontFamily: "Geist Mono Variable",
      fontSize: 16,
      fontWeight: 650,
      left: 56,
      letterSpacing: "0.12em",
      position: "absolute",
      textTransform: "uppercase",
      zIndex: 20,
    }}
  >
    Seeded demo inventory · Simulated Visa authorization · No live charge
  </div>
);

const Kicker = ({ children, color = LIME }: { children: React.ReactNode; color?: string }) => (
  <div
    style={{
      background: color,
      borderRadius: 999,
      color: INK,
      display: "inline-flex",
      fontFamily: "Geist Mono Variable",
      fontSize: 17,
      fontWeight: 800,
      letterSpacing: "0.1em",
      padding: "10px 16px",
      textTransform: "uppercase",
    }}
  >
    {children}
  </div>
);

const TitleScene = () => {
  const frame = useCurrentFrame();
  const enter = spring({ frame, fps: FPS, config: { damping: 18, mass: 0.7 } });

  return (
    <AbsoluteFill style={{ background: INK, opacity: fade(frame, s(12)), overflow: "hidden" }}>
      <Img
        src={hero}
        style={{
          height: "100%",
          objectFit: "cover",
          opacity: 0.92,
          position: "absolute",
          right: 0,
          transform: `scale(${1.035 + frame / 18000})`,
          transformOrigin: "75% 50%",
          width: "100%",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #0E4B3B 0%, rgba(14,75,59,.98) 37%, rgba(14,75,59,.3) 70%, rgba(14,75,59,.05) 100%)" }} />
      <Brand dark />
      <div
        style={{
          left: 82,
          maxWidth: 780,
          opacity: enter,
          position: "absolute",
          top: 205,
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
        }}
      >
        <Kicker>The request finishes here</Kicker>
        <div style={{ color: WHITE, fontFamily: "Georgia, serif", fontSize: 86, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 0.98, marginTop: 30 }}>
          Shopping should start<br />and finish with<br /><span style={{ color: LIME, fontStyle: "italic" }}>one request.</span>
        </div>
        <div style={{ color: WHITE, fontFamily: "Geist Variable", fontSize: 31, fontWeight: 600, marginTop: 36 }}>
          Everything works together.
        </div>
      </div>
      <Boundary dark />
    </AbsoluteFill>
  );
};

const ProblemScene = () => {
  const frame = useCurrentFrame();
  const steps = ["Compare products", "Check compatibility", "Find one store", "Rebuild checkout"];

  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fade(frame, s(18)), overflow: "hidden" }}>
      <Img
        src={friction}
        style={{
          height: "100%",
          objectFit: "cover",
          position: "absolute",
          transform: `scale(${1.03 + frame / 24000})`,
          width: "100%",
        }}
      />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(244,238,228,.99) 0%, rgba(244,238,228,.93) 47%, rgba(244,238,228,.08) 78%)" }} />
      <Brand />
      <div style={{ left: 76, position: "absolute", top: 160, width: 720 }}>
        <div style={{ color: INK, fontFamily: "Georgia, serif", fontSize: 72, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02 }}>
          Search gives links.<br />Buying still takes work.
        </div>
        <div style={{ display: "grid", gap: 13, marginTop: 42 }}>
          {steps.map((step, index) => {
            const reveal = spring({ frame: frame - index * 20 - 35, fps: FPS, config: { damping: 18 } });
            return (
              <div
                key={step}
                style={{
                  alignItems: "center",
                  background: index === steps.length - 1 ? CLAY : WHITE,
                  border: `1px solid ${index === steps.length - 1 ? CLAY : "rgba(14,75,59,.16)"}`,
                  borderRadius: 14,
                  color: index === steps.length - 1 ? WHITE : INK,
                  display: "flex",
                  fontFamily: "Geist Variable",
                  fontSize: 26,
                  fontWeight: 670,
                  gap: 18,
                  opacity: reveal,
                  padding: "15px 20px",
                  transform: `translateX(${interpolate(reveal, [0, 1], [-35, 0])}px)`,
                  width: 500,
                }}
              >
                <span style={{ fontFamily: "Geist Mono Variable", fontSize: 16, opacity: 0.7 }}>0{index + 1}</span>
                {step}
              </div>
            );
          })}
        </div>
      </div>
      <Boundary />
    </AbsoluteFill>
  );
};

const CompleteCartScene = () => {
  const frame = useCurrentFrame();
  const proof = [
    ["1", "merchant + pickup point"],
    ["4", "compatible components"],
    ["S$133", "under budget"],
  ];

  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fade(frame, s(18)), overflow: "hidden" }}>
      <Img src={completeKit} style={{ height: "100%", objectFit: "cover", position: "absolute", transform: `scale(${1.02 + frame / 26000})`, width: "100%" }} />
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(244,238,228,.99) 0%, rgba(244,238,228,.96) 38%, rgba(244,238,228,.12) 66%)" }} />
      <Brand />
      <div style={{ left: 76, position: "absolute", top: 145, width: 670 }}>
        <Kicker>Complete cart, not another list</Kicker>
        <div style={{ color: INK, fontFamily: "Georgia, serif", fontSize: 67, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, marginTop: 24 }}>
          One merchant.<br />Every thread checked.
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 35 }}>
          {proof.map(([value, label], index) => {
            const reveal = spring({ frame: frame - 35 - index * 16, fps: FPS, config: { damping: 17 } });
            return (
              <div key={label} style={{ background: WHITE, border: "1px solid rgba(14,75,59,.16)", borderRadius: 16, boxShadow: "0 16px 40px rgba(14,75,59,.08)", opacity: reveal, padding: "18px 16px", transform: `translateY(${interpolate(reveal, [0, 1], [24, 0])}px)`, width: 180 }}>
                <div style={{ color: index === 2 ? CLAY : INK, fontFamily: "Geist Variable", fontSize: 38, fontWeight: 820 }}>{value}</div>
                <div style={{ color: GREY, fontFamily: "Geist Variable", fontSize: 17, fontWeight: 630, lineHeight: 1.25, marginTop: 5 }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: WHITE, border: "1px solid rgba(14,75,59,.18)", borderRadius: 22, bottom: 90, boxShadow: "0 28px 80px rgba(14,75,59,.18)", height: 440, overflow: "hidden", position: "absolute", right: 54, transform: `translateY(${interpolate(spring({ frame: frame - 50, fps: FPS, config: { damping: 20 } }), [0, 1], [70, 0])}px)`, width: 690 }}>
        <Img src={buyerOverview} style={{ height: "100%", objectFit: "cover", objectPosition: "center 45%", width: "100%" }} />
      </div>
      <Boundary />
    </AbsoluteFill>
  );
};

const PromptScene = () => {
  const frame = useCurrentFrame();
  const showEvidence = interpolate(frame, [210, 260], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const quoteReveal = spring({ frame: frame - 12, fps: FPS, config: { damping: 20, mass: 0.8 } });

  return (
    <AbsoluteFill style={{ background: INK, opacity: fade(frame, s(42)), overflow: "hidden" }}>
      <div style={{ opacity: 1 - showEvidence }}>
        <Brand dark />
        <div style={{ left: 88, opacity: quoteReveal, position: "absolute", top: 150, transform: `translateY(${interpolate(quoteReveal, [0, 1], [30, 0])}px)`, width: 1040 }}>
          <Kicker>Ask once</Kicker>
          <div style={{ color: WHITE, fontFamily: "Georgia, serif", fontSize: 62, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.12, marginTop: 28 }}>
            “I fly to Tokyo tonight. Build a charging kit for my MacBook Air, iPhone and AirPods under S$150, with pickup today.”
          </div>
        </div>
        <div style={{ bottom: 105, display: "flex", gap: 14, left: 88, position: "absolute" }}>
          {["Tokyo", "3 devices", "S$150 hard cap", "Pickup today"].map((label, index) => (
            <div key={label} style={{ border: "1px solid rgba(252,250,245,.34)", borderRadius: 999, color: WHITE, fontFamily: "Geist Variable", fontSize: 20, fontWeight: 660, opacity: spring({ frame: frame - 75 - index * 10, fps: FPS, config: { damping: 18 } }), padding: "12px 18px" }}>{label}</div>
          ))}
        </div>
        <Boundary dark />
      </div>
      <div style={{ opacity: showEvidence }}>
        <Img src={askOnce} style={{ height: "100%", objectFit: "cover", position: "absolute", transform: `scale(${1.02 + Math.max(0, frame - 260) / 21000})`, transformOrigin: "69% 48%", width: "100%" }} />
        {frame > 400 && (
          <div style={{ background: "rgba(14,75,59,.94)", border: `2px solid ${LIME}`, borderRadius: 14, boxShadow: "0 14px 44px rgba(14,75,59,.28)", color: WHITE, fontFamily: "Geist Variable", fontSize: 24, fontWeight: 760, left: 1020, padding: "14px 18px", position: "absolute", top: 635 }}>
            ByteRoute · S$133 · 4 compatible items
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const CheckoutScene = () => {
  const frame = useCurrentFrame();
  const bridge = frame < 165;
  const confirmed = frame >= 855;

  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fade(frame, s(45)), overflow: "hidden" }}>
      {bridge ? (
        <>
          <Img src={humanConfirmation} style={{ height: "100%", objectFit: "cover", position: "absolute", transform: `scale(${1.02 + frame / 12000})`, width: "100%" }} />
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(244,238,228,.99) 0%, rgba(244,238,228,.93) 48%, rgba(244,238,228,.08) 75%)" }} />
          <Brand />
          <div style={{ left: 78, position: "absolute", top: 170, width: 700 }}>
            <Kicker color="#DCECE5">The trust boundary</Kicker>
            <div style={{ color: INK, fontFamily: "Georgia, serif", fontSize: 72, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.02, marginTop: 24 }}>
              The AI recommends.<br /><span style={{ color: BLUE, fontStyle: "italic" }}>The user authorizes.</span>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 36 }}>
              <div style={{ background: "rgba(182,64,50,.11)", border: "1px solid rgba(182,64,50,.25)", borderRadius: 12, color: CLAY, fontFamily: "Geist Mono Variable", fontSize: 16, fontWeight: 800, padding: "12px 15px" }}>IDENTITY · PLANNED</div>
              <div style={{ background: "rgba(21,69,232,.1)", border: "1px solid rgba(21,69,232,.22)", borderRadius: 12, color: BLUE, fontFamily: "Geist Mono Variable", fontSize: 16, fontWeight: 800, padding: "12px 15px" }}>EXACT TERMS · WORKING</div>
            </div>
          </div>
          <Boundary />
        </>
      ) : (
        <>
          <Img
            src={confirmed ? confirmOnce : reviewOnce}
            style={{
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              transform: `scale(${confirmed ? 1.025 : 1.02 + (frame - 165) / 26000})`,
              transformOrigin: confirmed ? "70% 50%" : "69% 51%",
              width: "100%",
            }}
          />
          {!confirmed && frame > 340 && (
            <div style={{ border: `4px solid ${BLUE}`, borderRadius: 16, boxShadow: `0 0 0 9px rgba(21,69,232,.13)`, height: 330, position: "absolute", right: 377, top: 278, width: 560 }} />
          )}
          {confirmed && (
            <div style={{ alignItems: "center", background: BLUE, borderRadius: 999, boxShadow: "0 16px 42px rgba(21,69,232,.28)", color: WHITE, display: "flex", fontFamily: "Geist Variable", fontSize: 22, fontWeight: 780, gap: 11, padding: "13px 20px", position: "absolute", right: 85, top: 64 }}>
              <span style={{ background: LIME, borderRadius: 999, height: 11, width: 11 }} />
              Simulated result · no live charge
            </div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

const MerchantScene = () => {
  const frame = useCurrentFrame();
  const pulse = 0.55 + Math.sin(frame / 10) * 0.15;

  return (
    <AbsoluteFill style={{ background: PAPER, opacity: fade(frame, s(20)), overflow: "hidden" }}>
      <Img src={merchantControl} style={{ height: "100%", objectFit: "cover", position: "absolute", transform: `scale(${1.015 + frame / 24000})`, transformOrigin: "68% 45%", width: "100%" }} />
      <div style={{ border: `4px solid rgba(21,69,232,${pulse})`, borderRadius: 18, height: 387, left: 458, position: "absolute", top: 305, width: 944 }} />
      <div style={{ background: INK, borderRadius: 14, bottom: 62, color: WHITE, fontFamily: "Geist Variable", fontSize: 23, fontWeight: 720, padding: "14px 18px", position: "absolute", right: 78 }}>
        Price · stock · decline · reversal · audit
      </div>
    </AbsoluteFill>
  );
};

const ClosingScene = () => {
  const frame = useCurrentFrame();
  const route = interpolate(frame, [15, 230], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: INK, opacity: fade(frame, s(25)), overflow: "hidden" }}>
      <Img src={close} style={{ height: "100%", objectFit: "cover", position: "absolute", transform: `scale(${1 + frame / 30000})`, width: "100%" }} />
      <AbsoluteFill style={{ background: `rgba(14,75,59,${interpolate(frame, [0, 300], [0.08, 0.45], { extrapolateRight: "clamp" })})` }} />
      <div style={{ height: 6, left: 90, overflow: "hidden", position: "absolute", right: 92, top: 638 }}>
        <div style={{ background: `linear-gradient(90deg, ${LIME}, ${BLUE})`, borderRadius: 99, height: "100%", transform: `scaleX(${route})`, transformOrigin: "left", width: "100%" }} />
      </div>
      <div style={{ background: LIME, border: `5px solid ${INK}`, borderRadius: 999, height: 26, left: 77, position: "absolute", top: 628, width: 26 }} />
      <div style={{ background: BLUE, border: `5px solid ${WHITE}`, borderRadius: 999, height: 26, position: "absolute", right: 79, top: 628, transform: `scale(${route})`, width: 26 }} />
    </AbsoluteFill>
  );
};

const VoiceoverTrack = () => (
  <>
    {voiceovers.map((clip) => (
      <Sequence key={clip.id} from={s(clip.start)} durationInFrames={s(clip.end - clip.start)} name={`Voiceover · ${clip.id}`}>
        <Audio src={staticFile(`woven-video/voiceover/${clip.id}.mp3`)} volume={0.96} />
      </Sequence>
    ))}
  </>
);

const WovenJudgeVideo = () => (
  <AbsoluteFill style={{ background: INK }}>
    <Sequence from={s(0)} durationInFrames={s(12)} name="01 · Opening"><TitleScene /></Sequence>
    <Sequence from={s(12)} durationInFrames={s(18)} name="02 · Problem"><ProblemScene /></Sequence>
    <Sequence from={s(30)} durationInFrames={s(18)} name="03 · Complete cart"><CompleteCartScene /></Sequence>
    <Sequence from={s(48)} durationInFrames={s(42)} name="04 · Ask once"><PromptScene /></Sequence>
    <Sequence from={s(90)} durationInFrames={s(45)} name="05 · Review and confirm"><CheckoutScene /></Sequence>
    <Sequence from={s(135)} durationInFrames={s(20)} name="06 · Merchant control"><MerchantScene /></Sequence>
    <Sequence from={s(155)} durationInFrames={s(25)} name="07 · Closing"><ClosingScene /></Sequence>
    <Audio src={staticFile("woven-video/ambient.mp3")} volume={0.8} />
    <VoiceoverTrack />
  </AbsoluteFill>
);

export const WovenVideoRoot = () => (
  <Composition
    id="WovenJudgeVideo"
    component={WovenJudgeVideo}
    durationInFrames={s(180)}
    fps={FPS}
    height={900}
    width={1600}
  />
);
