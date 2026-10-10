import "./UpgradePlan.css";

function UpgradePlan({ onClose }) {
  return (
    <div className="upgradeOverlay" onClick={onClose}>
      <section
        className="upgradePanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgradeTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="upgradeHeader">
          <div>
            <span className="upgradeEyebrow">NEXUSGPT PLANS</span>
            <h2 id="upgradeTitle">Choose your experience</h2>
            <p>Find the plan that suits your needs.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade plans"
          >
            ✕
          </button>
        </div>

        <div className="planGrid">
          <article className="planCard">
            <h3>Free</h3>
            <p className="planPrice">
              ₹0 <span>/ forever</span>
            </p>
            <p className="planDescription">For exploring NexusGPT.</p>

            <ul>
              <li>✓ AI chat interface</li>
              <li>✓ Conversation history</li>
              <li>✓ Personal account</li>
            </ul>

            <button
              type="button"
              className="planButton secondaryPlanButton"
              onClick={onClose}
            >
              Current experience
            </button>
          </article>

          <article className="planCard premiumPlanCard">
            <span className="planBadge">Coming soon</span>
            <h3>Premium</h3>
            <p className="planPrice">Coming soon</p>
            <p className="planDescription">For users who need more.</p>

            <ul>
              <li>✓ Planned higher usage limits</li>
              <li>✓ Planned premium model access</li>
              <li>✓ Future premium features</li>
            </ul>

            <button
              type="button"
              className="planButton"
              onClick={() => {
                alert("Premium plans are not available yet.");
              }}
            >
              Notify me later
            </button>
          </article>
        </div>

        <p className="upgradeNote">
          This is a preview. No subscription or payment is available yet.
        </p>
      </section>
    </div>
  );
}

export default UpgradePlan;
