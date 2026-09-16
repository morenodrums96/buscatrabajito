"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface Props {
  show: boolean;
  onCoverComplete: () => void;
  onSequenceComplete: () => void;
  onFinish: () => void;
}

export default function CVCompletionOverlay({
  show,
  onCoverComplete,
  onSequenceComplete,
  onFinish,
}: Props) {
  const coverCompleteRef = useRef(false);
  const sequenceCompleteRef = useRef(false);

  useEffect(() => {
    if (show) {
      coverCompleteRef.current = false;
      sequenceCompleteRef.current = false;
    }
  }, [show]);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: 1.6,
              ease: "easeInOut",
            },
          }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
          }}
          onAnimationComplete={() => {
            /*
             * Este callback ocurre cuando el overlay termina
             * de aparecer completamente.
             *
             * En ese momento podemos cambiar el contenido
             * de Wizard -> Dashboard porque el overlay ya
             * está cubriendo toda la pantalla.
             */
            if (!coverCompleteRef.current) {
              coverCompleteRef.current = true;
              onCoverComplete();
            }
          }}
          className="fixed inset-0 z-[9999] bg-[#0B192C] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background radial */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#2563EB]/25 via-[#0B192C]/60 to-[#0B192C]" />

          {/* Animated vertical light bars */}
          <div className="absolute inset-0 flex items-center justify-center gap-6 opacity-25 pointer-events-none">
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: 250,
                  opacity: 0,
                  scaleY: 0.3,
                }}
                animate={{
                  y: [-100, -300],
                  opacity: [0, 0.7, 0],
                  scaleY: [0.5, 2.0, 0.6],
                }}
                transition={{
                  duration: 3.0 + i * 0.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: i * 0.12,
                }}
                className="
                  w-12 sm:w-20
                  h-96
                  bg-gradient-to-t
                  from-[#2563EB]/10
                  via-[#2563EB]/40
                  to-white/60
                  border
                  border-[#2563EB]/30
                  rounded-xl
                  backdrop-blur-md
                  shadow-[0_0_30px_rgba(37,99,235,0.3)]
                "
              />
            ))}
          </div>

          {/* Central glow */}
          <motion.div
            initial={{
              scale: 0,
              opacity: 0,
            }}
            animate={{
              scale: [0, 2.5, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 1.8,
              ease: "easeOut",
              delay: 0.2,
            }}
            className="
              absolute
              w-96
              h-96
              bg-[#2563EB]
              rounded-full
              blur-3xl
              pointer-events-none
            "
          />

          {/* Main content */}
          <div className="relative z-10 text-center space-y-6 px-4">
            {/* Small title */}
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.5,
                duration: 0.6,
              }}
              className="
                inline-flex
                items-center
                gap-2
                text-[#60A5FA]
                tracking-[0.25em]
                uppercase
                text-xs
                font-mono
                font-bold
              "
            >
              <Sparkles className="w-4 h-4 animate-pulse" />

              Configuracion Completada
            </motion.div>

            {/* Logo */}
            <motion.h1
              initial={{
                scale: 0.85,
                opacity: 0,
                filter: "blur(8px)",
              }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: "blur(0px)",
              }}
              transition={{
                delay: 0.7,
                duration: 0.9,
                ease: "easeOut",
              }}
              className="
                text-4xl
                sm:text-6xl
                font-black
                tracking-tight
                drop-shadow-[0_0_24px_rgba(37,99,235,0.5)]
              "
              style={{
                fontFamily: "var(--font-plus-jakarta), sans-serif",
              }}
            >
              <span className="text-white">
                Busco
              </span>

              <span className="text-[#60A5FA]">
                Trabajito
              </span>
            </motion.h1>

            {/* Success message */}
            <motion.div
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 1.8,
                duration: 0.7,
              }}
              className="flex flex-col items-center gap-3"
            >
              <div
                className="
                  w-12
                  h-12
                  rounded-full
                  bg-[#10B981]/20
                  border
                  border-[#10B981]/40
                  flex
                  items-center
                  justify-center
                "
              >
                <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
              </div>

              <p
                className="
                  text-[#93C5FD]
                  text-sm
                  font-mono
                  tracking-widest
                  font-semibold
                  uppercase
                "
              >
                Tu perfil ya esta activo
              </p>
            </motion.div>

            {/* Progress */}
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              transition={{
                delay: 2.2,
                duration: 0.4,
              }}
              className="w-64 mx-auto"
            >
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{
                    width: "0%",
                  }}
                  animate={{
                    width: "100%",
                  }}
                  transition={{
                    delay: 2.4,
                    duration: 2.4,
                    ease: "easeInOut",
                  }}
                  onAnimationComplete={() => {
                    /*
                     * La barra llegó al 100%.
                     *
                     * Ahora sí podemos comenzar el fade-out
                     * del overlay.
                     */
                    if (!sequenceCompleteRef.current) {
                      sequenceCompleteRef.current = true;
                      onSequenceComplete();
                    }
                  }}
                  className="
                    h-full
                    bg-gradient-to-r
                    from-[#2563EB]
                    via-[#60A5FA]
                    to-[#10B981]
                    rounded-full
                  "
                />
              </div>

              <p
                className="
                  text-[10px]
                  text-white/30
                  font-mono
                  mt-2
                  tracking-widest
                "
              >
                Preparando tu dashboard...
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}