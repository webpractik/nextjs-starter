export function FFGuide() {
    return (
        <div className="space-y-4 text-sm">
            <div>
                <ol className="list-inside list-decimal space-y-1 text-gray-700">
                    <li>Перейдите к своему проекту в GitLab → Deploy → Feature Flags</li>
                    <li>Создайте флаг с необходимой стратегией</li>
                    <li>Установите environment</li>
                </ol>
            </div>

            <div className="rounded bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                    <strong>Примечание:</strong> Состояния флагов переопределяются только в GitLab.
                </p>
            </div>
        </div>
    );
}
