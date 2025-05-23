import type { Alert } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface ResultsDisplayProps {
	results: Alert[];
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
	return (
		<Card className="mt-4">
			<CardHeader>
				<CardTitle>Результати виявлення</CardTitle>
			</CardHeader>
			<CardContent>
				{results.length === 0 ? (
					<p>Немає даних</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Час</TableHead>
								<TableHead>Тип звуку</TableHead>
								<TableHead>Впевненість</TableHead>
								<TableHead>Локація</TableHead>
								<TableHead>Сенсор</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{results.map((result) => (
								<TableRow key={result.message_id}>
									<TableCell>
										{new Date(result.timestamp).toLocaleString()}
									</TableCell>
									<TableCell>{result.sound_type}</TableCell>
									<TableCell>{result.confidence.toFixed(2)}%</TableCell>
									<TableCell>
										{result.location.latitude}, {result.location.longitude}
									</TableCell>
									<TableCell>{result.sensor_id}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
};

export default ResultsDisplay;
