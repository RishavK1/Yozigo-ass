import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { formatCurrency } from "@/utils/format";

interface PaymentModalProps {
  isOpen: boolean;
  seats: string[];
  totalAmount: number;
  isProcessing: boolean;
  onSuccess: () => void;
  onFailure: () => void;
  onClose: () => void;
}

export function PaymentModal({
  isOpen,
  seats,
  totalAmount,
  isProcessing,
  onSuccess,
  onFailure,
  onClose,
}: PaymentModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={isProcessing ? undefined : onClose} title="Complete your payment">
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          This is a simulated payment step for the assessment. No real money is involved.
        </p>

        <div className="rounded-lg bg-ink-50 p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Seats</span>
            <span className="font-semibold text-ink-900">{seats.join(", ")}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-ink-200 pt-2">
            <span className="text-ink-500">Amount payable</span>
            <span className="font-bold text-ink-900">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="danger" onClick={onFailure} isLoading={isProcessing}>
            Payment failure
          </Button>
          <Button variant="primary" onClick={onSuccess} isLoading={isProcessing}>
            Payment success
          </Button>
        </div>
      </div>
    </Modal>
  );
}
