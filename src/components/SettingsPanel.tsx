import type { Settings } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface SettingsPanelProps {
	settings: Settings;
	onUpdate: (settings: Settings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
	settings,
	onUpdate,
}) => {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Налаштування</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="interval">Інтервал запису (сек)</Label>
					<Input
						id="interval"
						type="number"
						value={settings.interval}
						onChange={(e) =>
							onUpdate({ ...settings, interval: Number(e.target.value) })
						}
						min={10}
						max={300}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="duration">Тривалість запису (сек)</Label>
					<Input
						id="duration"
						type="number"
						value={settings.duration}
						onChange={(e) =>
							onUpdate({ ...settings, duration: Number(e.target.value) })
						}
						min={1}
						max={10}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="threshold">Поріг подібності (%)</Label>
					<Slider
						id="threshold"
						value={[settings.threshold]}
						onValueChange={(value) =>
							onUpdate({ ...settings, threshold: value[0] })
						}
						min={50}
						max={95}
						step={5}
					/>
					<p className="text-sm text-gray-500 mt-1">{settings.threshold}%</p>
				</div>
			</CardContent>
		</Card>
	);
};

export default SettingsPanel;
