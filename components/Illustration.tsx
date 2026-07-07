import Svg, { Circle, Ellipse, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

function parseSize(className = 'w-24 h-24') {
  const w = className.match(/w-(\d+)/);
  const h = className.match(/h-(\d+)/);
  return { width: w ? Number(w[1]) * 4 : 96, height: h ? Number(h[1]) * 4 : 96 };
}

export default function Illustration({ type, className = 'w-24 h-24', color = '#fff' }: { type: string; className?: string; color?: string }) {
  const { width, height } = parseSize(className);
  switch (type) {

    case 'tire':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Flat Tire Wheel */}
          <Circle cx="50" cy="45" r="28" stroke="#FACC15" />
          <Circle cx="50" cy="45" r="12" />
          <Line x1="50" y1="17" x2="50" y2="73" strokeDasharray="2 2" />
          <Line x1="22" y1="45" x2="78" y2="45" strokeDasharray="2 2" />
          {/* Ground */}
          <Line x1="15" y1="78" x2="85" y2="78" strokeWidth="3" />
          {/* Flat bottom indication */}
          <Path d="M30 70 C 40 78, 60 78, 70 70" stroke="#FACC15" strokeWidth="4" fill="none" />
          {/* Air escaping lines */}
          <Path d="M78 55 C 83 55, 85 52, 88 56" stroke="#fff" strokeWidth="1.5" />
          <Path d="M76 63 C 81 65, 84 63, 86 67" stroke="#fff" strokeWidth="1.5" />
        </Svg>
      );

    case 'pepper':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Spray Can */}
          <Rect x="20" y="45" width="20" height="40" rx="3" stroke="#FACC15" />
          <Path d="M25 45 L25 35 L35 35 L35 45" stroke="#FACC15" />
          <Path d="M27 35 L33 35 L30 30 Z" fill="#FACC15" />
          {/* Spray Mist */}
          <Path d="M38 32 C 50 25, 60 20, 75 25 C 65 35, 55 40, 38 32" fill="#FACC15" opacity="0.6" />
          {/* Eyes crying */}
          <Path d="M70 45 Q75 40 80 45" stroke="#fff" strokeWidth="3" />
          <Path d="M85 45 Q90 40 95 45" stroke="#fff" strokeWidth="3" />
          {/* Tears */}
          <Path d="M75 48 Q72 58 74 65" stroke="#60A5FA" strokeWidth="2" />
          <Path d="M90 48 Q88 58 91 65" stroke="#60A5FA" strokeWidth="2" />
          {/* Fire symbol on spray */}
          <Path d="M27 65 Q30 55 33 65 T30 75 Z" fill="#EF4444" stroke="none" />
        </Svg>
      );

    case 'fart':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Stick figure bending over */}
          <Circle cx="35" cy="30" r="8" stroke="#fff" />
          <Path d="M35 38 L45 55 L35 70" stroke="#fff" />
          <Path d="M45 55 L60 58 L70 70" stroke="#fff" /> {/* Legs */}
          <Path d="M35 45 L20 48 L15 35" stroke="#fff" /> {/* Arm */}
          {/* Fart Cloud */}
          <Path d="M65 45 C 75 35, 90 40, 85 55 C 95 60, 80 75, 70 65 C 60 75, 55 55, 65 45 Z" fill="#FACC15" opacity="0.7" stroke="none" />
          {/* Odor lines */}
          <Path d="M20 25 Q15 20 18 15" stroke="#FACC15" />
          <Path d="M12 28 Q8 25 10 20" stroke="#FACC15" />
        </Svg>
      );

    case 'car':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Bicycle Wheel */}
          <Circle cx="25" cy="70" r="15" stroke="#fff" />
          <Path d="M25 70 L45 55 M45 55 L60 70" stroke="#fff" />
          {/* Open Car Door */}
          <Rect x="65" y="30" width="25" height="50" rx="2" stroke="#FACC15" fill="#1E1E1E" />
          <Circle cx="70" cy="55" r="3" fill="#FACC15" />
          {/* Collision impact */}
          <Path d="M45 55 L58 40" stroke="#EF4444" strokeWidth="3" />
          <Path d="M50 48 L42 35 L55 25" stroke="#fff" /> {/* Flying rider */}
          <Circle cx="58" cy="20" r="5" stroke="#fff" /> {/* Rider head */}
          {/* Action Stars */}
          <Path d="M52 42 L55 45 L52 48" stroke="#FACC15" />
          <Path d="M48 40 L52 38 L46 36" stroke="#FACC15" />
        </Svg>
      );

    case 'burger':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Burger Buns */}
          <Path d="M20 45 C20 20, 80 20, 80 45 Z" fill="#EAB308" stroke="#EAB308" />
          <Rect x="18" y="55" width="64" height="15" rx="4" fill="#EAB308" stroke="#EAB308" />
          {/* Burger Meat */}
          <Rect x="15" y="48" width="70" height="8" rx="2" fill="#4B5563" />
          {/* Condom sticking out */}
          <Path d="M45 53 C45 65, 55 68, 50 82 C56 82, 57 78, 55 65" stroke="#fff" strokeWidth="3" fill="#fff" fillOpacity="0.2" />
          <Circle cx="50" cy="82" r="3" fill="#fff" />
          {/* Sparkles of disgust */}
          <Path d="M25 25 L28 28" stroke="#EF4444" />
          <Path d="M75 25 L72 28" stroke="#EF4444" />
        </Svg>
      );

    case 'house':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Locked House */}
          <Path d="M50 15 L15 45 L25 45 L25 85 L75 85 L75 45 L85 45 Z" stroke="#FACC15" fill="#1E1E1E" />
          {/* Window with sad stick figure */}
          <Rect x="38" y="45" width="24" height="24" stroke="#fff" />
          <Line x1="50" y1="45" x2="50" y2="69" stroke="#fff" strokeWidth="1" />
          <Line x1="38" y1="57" x2="62" y2="57" stroke="#fff" strokeWidth="1" />
          {/* Face */}
          <Circle cx="45" cy="52" r="3" fill="#fff" />
          {/* Heavy Padlock on door */}
          <Rect x="44" y="73" width="12" height="10" rx="1" fill="#EF4444" stroke="none" />
          <Path d="M46 73 C46 68, 54 68, 54 73" stroke="#EF4444" strokeWidth="1.5" fill="none" />
        </Svg>
      );

    case 'bear':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Bear Trap */}
          <Path d="M20 75 Q50 95 80 75" stroke="#9CA3AF" strokeWidth="4" />
          {/* Sharp teeth left */}
          <Path d="M20 75 L25 60 L30 75 L35 60 L40 75 L45 60 L50 75" stroke="#FACC15" strokeWidth="2" />
          {/* Sharp teeth right */}
          <Path d="M50 75 L55 60 L60 75 L65 60 L70 75 L75 60 L80 75" stroke="#FACC15" strokeWidth="2" />
          {/* Stuck foot */}
          <Path d="M50 80 L50 45 M50 45 L35 40" stroke="#fff" strokeWidth="3" />
          <Path d="M50 80 L55 85" stroke="#fff" strokeWidth="3" />
          {/* Bear Outline (Approaching) */}
          <Circle cx="80" cy="30" r="10" fill="#EAB308" fillOpacity="0.4" stroke="#EAB308" />
          <Circle cx="73" cy="22" r="3" fill="#EAB308" />
          <Circle cx="87" cy="22" r="3" fill="#EAB308" />
          {/* Scared face on stuck figure */}
          <Circle cx="35" cy="40" r="6" stroke="#fff" />
          <Path d="M33 42 Q35 39 37 42" stroke="#fff" /> {/* Sad mouth */}
        </Svg>
      );

    case 'lego':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* LEGO block */}
          <Rect x="35" y="65" width="30" height="15" rx="2" fill="#EF4444" stroke="#fff" />
          <Rect x="40" y="58" width="6" height="7" fill="#EF4444" stroke="#fff" />
          <Rect x="54" y="58" width="6" height="7" fill="#EF4444" stroke="#fff" />
          {/* Foot stepping down */}
          <Path d="M15 35 Q30 35 42 45 L52 62 L42 63 L30 50 L15 45 Z" stroke="#fff" strokeWidth="3" fill="#111" />
          {/* Impact stars */}
          <Path d="M50 58 L52 50 L56 56 L64 52 L58 60" stroke="#FACC15" strokeWidth="2" fill="none" />
          <Path d="M38 58 L32 52 L36 58" stroke="#FACC15" strokeWidth="2" />
        </Svg>
      );

    case 'toilet':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Toilet Bowl Outline */}
          <Path d="M25 25 C25 25, 20 60, 45 75 C60 80, 75 70, 75 55 L75 25 Z" stroke="#fff" />
          <Ellipse cx="50" cy="25" rx="25" ry="10" stroke="#fff" fill="#1E1E1E" />
          {/* Phone Splashing in */}
          <Rect x="42" y="24" width="16" height="28" rx="2" stroke="#FACC15" fill="#111" transform="rotate(15 50 38)" />
          {/* Screen detail inside phone */}
          <Line x1="46" y1="30" x2="54" y2="45" stroke="#FACC15" strokeWidth="1" />
          {/* Splash droplets */}
          <Circle cx="35" cy="18" r="2" fill="#3B82F6" />
          <Circle cx="65" cy="16" r="2" fill="#3B82F6" />
          <Circle cx="50" cy="12" r="3" fill="#3B82F6" />
        </Svg>
      );

    case 'phone':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Phone */}
          <Rect x="30" y="15" width="40" height="70" rx="6" stroke="#fff" fill="#1E1E1E" />
          {/* Home Button / Speaker */}
          <Circle cx="50" cy="80" r="3" stroke="#fff" />
          <Line x1="45" y1="20" x2="55" y2="20" stroke="#fff" />
          {/* Screaming or chat bubble */}
          <Rect x="35" y="30" width="30" height="20" rx="3" fill="#EF4444" stroke="none" />
          <Polygon points="40,50 45,55 45,50" fill="#EF4444" stroke="none" />
          {/* Chat text lines */}
          <Line x1="40" y1="36" x2="60" y2="36" stroke="#fff" strokeWidth="2" />
          <Line x1="40" y1="42" x2="55" y2="42" stroke="#fff" strokeWidth="2" />
          {/* Exclamation marks of dread */}
          <SvgText x="75" y="40" fill="#FACC15" fontSize="20" fontWeight="bold">!</SvgText>
          <SvgText x="82" y="50" fill="#FACC15" fontSize="16" fontWeight="bold">?</SvgText>
        </Svg>
      );

    case 'lightning':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Thundercloud */}
          <Path d="M25 45 C20 40, 20 30, 35 28 C38 18, 55 15, 65 25 C75 20, 85 30, 80 42 C85 50, 75 60, 65 55 C55 60, 35 60, 25 45 Z" fill="#4B5563" stroke="#fff" />
          {/* Giant Bolt */}
          <Polygon points="52,45 35,68 50,68 40,92 65,60 48,60" fill="#FACC15" stroke="#EAB308" strokeWidth="1" />
          {/* Sparkles of electricity */}
          <Circle cx="30" cy="75" r="1.5" fill="#FACC15" />
          <Circle cx="70" cy="72" r="1.5" fill="#FACC15" />
        </Svg>
      );

    case 'goose':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Angry Goose */}
          <Path d="M50 65 Q35 50 25 50 C20 50, 15 45, 18 30 C20 20, 28 15, 33 22 Q35 28 32 35 L45 50 Z" stroke="#fff" fill="#111" />
          <Path d="M50 65 L65 72 M50 65 L40 75" stroke="#fff" /> {/* Legs */}
          {/* Beak biting */}
          <Polygon points="33,22 41,18 36,26" fill="#FACC15" stroke="none" />
          {/* Wing flaps */}
          <Path d="M25 50 Q15 65 22 75 C29 65, 25 50, 25 50" fill="#fff" opacity="0.4" />
          {/* Terrified fleeing stick figure */}
          <Circle cx="75" cy="35" r="5" stroke="#fff" />
          <Path d="M75 40 L70 58 L62 70" stroke="#fff" />
          <Path d="M70 58 L78 72" stroke="#fff" />
          <Path d="M75 45 L85 40 M75 45 L62 42" stroke="#fff" />
        </Svg>
      );

    case 'wifi':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* WiFi router */}
          <Rect x="30" y="65" width="40" height="15" rx="3" stroke="#fff" fill="#1E1E1E" />
          <Line x1="38" y1="65" x2="38" y2="50" stroke="#fff" strokeWidth="3" /> {/* Antennas */}
          <Line x1="62" y1="65" x2="62" y2="50" stroke="#fff" strokeWidth="3" />
          {/* Dead Signal Wave arcs with a red crossing strike */}
          <Path d="M35 40 A20 20 0 0 1 65 40" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
          <Path d="M25 30 A30 30 0 0 1 75 30" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
          <Circle cx="50" cy="52" r="3" fill="#EF4444" />
          {/* Red X over the signal */}
          <Line x1="35" y1="20" x2="65" y2="50" stroke="#EF4444" strokeWidth="5" />
          <Line x1="65" y1="20" x2="35" y2="50" stroke="#EF4444" strokeWidth="5" />
        </Svg>
      );

    case 'heart':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Heart split in half */}
          <Path d="M50 30 C45 15, 15 15, 15 45 C15 65, 45 85, 50 90 C55 85, 85 65, 85 45 C85 15, 55 15, 50 30 Z" fill="#EF4444" stroke="#fff" />
          {/* Jagged crack line */}
          <Path d="M50 30 L45 42 L55 54 L45 66 L52 78 L50 90" stroke="#111" strokeWidth="3" fill="none" />
          {/* Yellow Post-it note */}
          <Rect x="42" y="38" width="30" height="30" fill="#FACC15" stroke="#EAB308" transform="rotate(10 57 53)" />
          {/* Scribbled text on sticky note */}
          <Line x1="48" y1="45" x2="65" y2="48" stroke="#111" strokeWidth="1" />
          <Line x1="46" y1="52" x2="63" y2="55" stroke="#111" strokeWidth="1" />
          <Line x1="45" y1="59" x2="58" y2="61" stroke="#111" strokeWidth="1" />
        </Svg>
      );

    case 'tooth':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Papercut Tongue and Mouth */}
          <Path d="M20 40 Q50 20 80 40 Q50 90 20 40 Z" fill="#111" stroke="#fff" />
          {/* Tongue sticking out */}
          <Path d="M35 55 C35 75, 65 75, 65 55 Z" fill="#EF4444" stroke="#fff" />
          {/* Center line of tongue */}
          <Line x1="50" y1="55" x2="50" y2="70" stroke="#fff" strokeWidth="1.5" />
          {/* Knife or sharp paper slice */}
          <Polygon points="25,65 55,58 30,48" fill="#fff" stroke="#FACC15" />
          {/* Blood droplet */}
          <Circle cx="53" cy="67" r="2.5" fill="#EF4444" stroke="none" />
          <Circle cx="48" cy="72" r="1.5" fill="#EF4444" stroke="none" />
        </Svg>
      );

    case 'coffee':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Spilling Coffee Cup */}
          <Rect x="25" y="30" width="35" height="30" rx="4" stroke="#FACC15" fill="#1E1E1E" transform="rotate(-35 42 45)" />
          <Path d="M20 30 C12 35, 14 45, 22 45" stroke="#FACC15" strokeWidth="3" fill="none" transform="rotate(-35 42 45)" />
          {/* Splashing Liquid */}
          <Path d="M48 25 C 55 15, 65 18, 75 32 C 65 38, 55 35, 48 25" fill="#78350F" stroke="#FACC15" />
          {/* Spilled on pants (stick figure legs) */}
          <Path d="M70 50 L70 85 M82 50 L82 85" stroke="#fff" strokeWidth="4" />
          {/* Steam rising */}
          <Path d="M35 15 Q38 10 35 5" stroke="#fff" strokeWidth="1.5" />
          <Path d="M43 18 Q46 13 43 8" stroke="#fff" strokeWidth="1.5" />
        </Svg>
      );

    case 'passport':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Passport Booklet */}
          <Rect x="25" y="20" width="45" height="60" rx="3" fill="#1E3A8A" stroke="#FACC15" strokeWidth="3" />
          {/* Golden crest detail on passport */}
          <Circle cx="47" cy="45" r="10" stroke="#FACC15" strokeWidth="1.5" strokeDasharray="3 3" />
          <Line x1="47" y1="35" x2="47" y2="55" stroke="#FACC15" />
          <Line x1="37" y1="45" x2="57" y2="45" stroke="#FACC15" />
          {/* Exclamation marks / missing status */}
          <SvgText x="75" y="55" fill="#EF4444" fontSize="32" fontWeight="black">?</SvgText>
          {/* Shredded bottom */}
          <Path d="M22 80 L35 75 L45 82 L55 76 L68 83 L73 78" stroke="#EF4444" strokeWidth="2.5" />
        </Svg>
      );

    case 'spider':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Pillow / Bed */}
          <Rect x="15" y="55" width="70" height="35" rx="5" stroke="#fff" fill="#1E1E1E" />
          {/* Spider Body */}
          <Ellipse cx="50" cy="45" rx="10" ry="14" fill="#111" stroke="#FACC15" strokeWidth="3" />
          <Circle cx="50" cy="28" r="7" fill="#111" stroke="#FACC15" strokeWidth="2" />
          {/* Spider Legs */}
          <Path d="M42 38 Q25 35 20 48" stroke="#FACC15" strokeWidth="2" />
          <Path d="M40 45 Q20 45 15 58" stroke="#FACC15" strokeWidth="2" />
          <Path d="M41 52 Q22 55 22 70" stroke="#FACC15" strokeWidth="2" />
          
          <Path d="M58 38 Q75 35 80 48" stroke="#FACC15" strokeWidth="2" />
          <Path d="M60 45 Q80 45 85 58" stroke="#FACC15" strokeWidth="2" />
          <Path d="M59 52 Q78 55 78 70" stroke="#FACC15" strokeWidth="2" />
          
          {/* Glowing Red Eyes */}
          <Circle cx="47" cy="28" r="1.5" fill="#EF4444" stroke="none" />
          <Circle cx="53" cy="28" r="1.5" fill="#EF4444" stroke="none" />
        </Svg>
      );

    case 'wasp':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Wasp flying */}
          <Ellipse cx="45" cy="45" rx="8" ry="12" fill="#EAB308" stroke="#111" transform="rotate(45 45 45)" />
          {/* Black Stripes */}
          <Path d="M41 42 Q45 40 48 45" stroke="#111" strokeWidth="3" />
          <Path d="M37 47 Q42 45 45 50" stroke="#111" strokeWidth="3" />
          {/* Wings */}
          <Ellipse cx="40" cy="25" rx="6" ry="15" fill="#fff" fillOpacity="0.4" stroke="#fff" transform="rotate(-15 40 25)" />
          <Ellipse cx="58" cy="32" rx="5" ry="12" fill="#fff" fillOpacity="0.4" stroke="#fff" transform="rotate(15 58 32)" />
          {/* Stinger */}
          <Polygon points="28,58 20,65 32,56" fill="#111" stroke="#EF4444" />
          {/* Buzz lines */}
          <Path d="M65 25 Q70 20 68 15" stroke="#FACC15" />
          <Path d="M70 50 Q75 48 72 43" stroke="#FACC15" />
        </Svg>
      );

    case 'money':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Washed/Soggy money stack */}
          <Rect x="25" y="35" width="50" height="30" rx="3" fill="#047857" stroke="#10B981" strokeDasharray="3 3" />
          <SvgText x="45" y="55" fill="#FACC15" fontSize="18" fontWeight="bold">$</SvgText>
          {/* Water spirals */}
          <Path d="M15 25 C30 15, 70 15, 85 25" stroke="#3B82F6" strokeWidth="1.5" />
          <Path d="M10 50 C40 40, 60 70, 90 50" stroke="#3B82F6" strokeWidth="1.5" />
          {/* Torn edges of the lottery bill */}
          <Path d="M22 35 C28 42, 21 50, 26 65" stroke="#EF4444" strokeWidth="3" fill="none" />
        </Svg>
      );

    case 'clippy':
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Clippy Paperclip Body */}
          <Path d="M40 75 L40 30 C40 20, 60 20, 60 30 L60 65 C60 72, 48 72, 48 65 L48 38 C48 33, 54 33, 54 38 L54 58" stroke="#9CA3AF" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Googly Eyes */}
          <Circle cx="43" cy="28" r="5" fill="#fff" stroke="#111" strokeWidth="1" />
          <Circle cx="44" cy="28" r="2" fill="#111" />
          
          <Circle cx="53" cy="28" r="5" fill="#fff" stroke="#111" strokeWidth="1" />
          <Circle cx="52" cy="28" r="2" fill="#111" />
          
          {/* Raising suspicious eyebrows */}
          <Path d="M38 21 Q43 23 46 21" stroke="#FACC15" strokeWidth="2.5" />
          <Path d="M49 20 Q53 18 57 22" stroke="#FACC15" strokeWidth="2.5" />
          {/* Smug mouth */}
          <Path d="M43 38 Q48 42 53 38" stroke="#fff" strokeWidth="2" />
        </Svg>
      );

    case 'general_misery':
    default:
      return (
        <Svg color={color} width={width} height={height} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth={2.5}>
          {/* Stick figure crying under a rain cloud */}
          <Path d="M25 25 C20 22, 22 15, 35 15 C40 8, 60 8, 65 15 C75 12, 80 18, 75 25 C82 32, 70 40, 65 35 C55 40, 35 40, 25 25 Z" fill="#374151" stroke="#FACC15" />
          {/* Rain lines */}
          <Line x1="30" y1="42" x2="28" y2="52" stroke="#60A5FA" strokeWidth="2" />
          <Line x1="45" y1="45" x2="43" y2="55" stroke="#60A5FA" strokeWidth="2" />
          <Line x1="60" y1="44" x2="58" y2="54" stroke="#60A5FA" strokeWidth="2" />
          <Line x1="72" y1="41" x2="70" y2="51" stroke="#60A5FA" strokeWidth="2" />
          {/* Stick Figure Head and Body */}
          <Circle cx="50" cy="58" r="7" stroke="#fff" />
          <Path d="M50 65 L50 82 M50 72 L35 68 M50 72 L65 68 M50 82 L40 95 M50 82 L60 95" stroke="#fff" />
          {/* Tears coming out of eyes */}
          <Circle cx="48" cy="58" r="1" fill="#60A5FA" />
          <Circle cx="52" cy="58" r="1" fill="#60A5FA" />
      </Svg>
    );
  }
}

